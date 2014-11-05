angular.module('drugOrders', ['orderService', 'encounterService', 'uicommons.filters', 'uicommons.widget.select-concept-from-list',
    'uicommons.widget.select-order-frequency', 'uicommons.widget.select-drug']).

    config(function($locationProvider) {
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
    }).

    filter('omrsDate', ['$filter', function($filter) {
        return function(isoString) {
            return $filter('date')(isoString, "dd/MM/yyyy H:mm");
        }
    }]).

    filter('dates', ['omrsDateFilter', function(omrsDateFilter) {
        return function(order) {
            if (!order || typeof order != 'object') {
                return "";
            }
            if (order.action === 'DISCONTINUE' || !order.dateActivated) {
                return "";
            } else {
                var text = omrsDateFilter(order.dateActivated);
                if (order.dateStopped) {
                    text += ' - ' + omrsDateFilter(order.dateStopped);
                }
                else if (order.autoExpireDate) {
                    text += ' - ' + omrsDateFilter(order.autoExpireDate);
                }
                return text;
            }
        }
    }]).

    filter('instructions', function() {
        return function(order) {
            if (!order || typeof order != 'object') {
                return "";
            }
            if (order.action == 'DISCONTINUE') {
                return "Discontinue " + (order.drug ? order.drug : order.concept ).display;
            }
            else {
                var text = order.getDosingType().format(order);
                if (order.quantity) {
                    text += ' (Dispense: ' + order.quantity + ' ' + order.quantityUnits.display + ')';
                }
                return text;
            }
        }
    }).

    filter('replacement', ['omrsDateFilter', function(omrsDateFilter) {
        // given the order that replaced the one we are displaying, display the details of the replacement
        return function(replacementOrder) {
            if (!replacementOrder) {
                return "";
            }
            return emr.message("orderentryui.pastAction." + replacementOrder.action) + ", " + omrsDateFilter(replacementOrder.dateActivated);
        }
    }]).

    controller('DrugOrdersCtrl', ['$scope', '$window', '$location', '$timeout', 'OrderService', 'EncounterService',
        function($scope, $window, $location, $timeout, OrderService, EncounterService) {

            // TODO changing dosingType of a draft order should reset defaults (and discard non-defaulted properties)

            function loadExistingOrders() {
                $scope.activeDrugOrders = { loading: true };
                OrderService.getOrders({
                    t: 'drugorder',
                    v: 'full',
                    patient: config.patient.uuid,
                    careSetting: $scope.careSetting.uuid
                }).then(function(results) {
                    $scope.activeDrugOrders = _.map(results, function(item) { return new OpenMRS.DrugOrderModel(item) });
                });

                $scope.pastDrugOrders = { loading: true };
                OrderService.getOrders({
                    t: 'drugorder',
                    v: 'full',
                    patient: config.patient.uuid,
                    careSetting: $scope.careSetting.uuid,
                    status: 'inactive'
                }).then(function(results) {
                    $scope.pastDrugOrders = _.map(results, function(item) { return new OpenMRS.DrugOrderModel(item) });
                });
            }


            function replaceWithUuids(obj, props) {
                var replaced = angular.extend({}, obj);
                _.each(props, function(prop) {
                    if (replaced[prop] && replaced[prop].uuid) {
                        replaced[prop] = replaced[prop].uuid;
                    }
                });
                return replaced;
            }

            $scope.loading = false;

            $scope.activeDrugOrders = { loading: true };
            $scope.pastDrugOrders = { loading: true };
            $scope.draftDrugOrders = [];
            $scope.dosingTypes = OpenMRS.dosingTypes;

            var config = OpenMRS.drugOrdersConfig;
            $scope.init = function() {
                $scope.routes = config.routes;
                $scope.doseUnits = config.doseUnits;
                $scope.durationUnits = config.durationUnits;
                $scope.quantityUnits = config.quantityUnits;
                $scope.frequencies = config.frequencies;
                $scope.careSettings = config.careSettings;
                $scope.careSetting = config.intialCareSetting ?
                    _.findWhere(config.careSettings, { uuid: config.intialCareSetting }) :
                    config.careSettings[0];

                $scope.newDraftDrugOrder = OpenMRS.createEmptyDraftOrder($scope.careSetting);

                loadExistingOrders();

                $timeout(function() {
                    angular.element('#new-order input[type=text]').first().focus();
                });
            }


            // functions that affect the overall state of the page

            $scope.setCareSetting = function(careSetting) {
                // TODO confirm dialog or undo functionality if this is going to discard things
                $scope.careSetting = careSetting;
                loadExistingOrders();
                $scope.draftDrugOrders = [];
                $scope.newDraftDrugOrder = OpenMRS.createEmptyDraftOrder($scope.careSetting);
                $location.search({ patient: config.patient.uuid, careSetting: careSetting.uuid });
            }


            // functions that affect the new order being written

            $scope.addNewDraftOrder = function() {
                if ($scope.newDraftDrugOrder.getDosingType().validate($scope.newDraftDrugOrder)) {
                    $scope.newDraftDrugOrder.asNeeded = $scope.newDraftDrugOrder.asNeededCondition ? true : false;
                    $scope.draftDrugOrders.push($scope.newDraftDrugOrder);
                    $scope.newDraftDrugOrder = OpenMRS.createEmptyDraftOrder($scope.careSetting);
                    $scope.newOrderForm.$setPristine();
                    // TODO upgrade to angular 1.3 and work on form validation
                    $scope.newOrderForm.$setUntouched();
                } else {
                    emr.errorMessage("Invalid");
                }
            }

            $scope.cancelNewDraftOrder = function() {
                $scope.newDraftDrugOrder = OpenMRS.createEmptyDraftOrder($scope.careSetting);
            }


            // functions that affect the shopping cart of orders written but not yet saved

            $scope.cancelAllDraftDrugOrders = function() {
                $scope.draftDrugOrders = [];
            }

            $scope.cancelDraftDrugOrder = function(draftDrugOrder) {
                $scope.draftDrugOrders = _.without($scope.draftDrugOrders, draftDrugOrder);
            }

            $scope.editDraftDrugOrder = function(draftDrugOrder) {
                $scope.draftDrugOrders = _.without($scope.draftDrugOrders, draftDrugOrder);
                $scope.newDraftDrugOrder = draftDrugOrder;
            }

            /**
             * Finds the replacement order for a given active order (e.g. the order that will DC or REVISE it)
             */
            $scope.replacementFor = function(activeOrder) {
                return _.findWhere(_.union($scope.draftDrugOrders, [$scope.newDraftDrugOrder]), { previousOrder: activeOrder });
            }

            $scope.replacementForPastOrder = function(pastOrder) {
                var candidates = _.union($scope.activeDrugOrders, $scope.pastDrugOrders)
                return _.find(candidates, function(item) {
                    return item.previousOrder && item.previousOrder.uuid === pastOrder.uuid;
                });
            }

            $scope.signAndSaveDraftDrugOrders = function() {
                var orders = _.map($scope.draftDrugOrders, function(order) {
                    return replaceWithUuids(order, ['drug', 'doseUnits', 'frequency', 'quantityUnits',
                        'durationUnits', 'route', 'previousOrder', 'careSetting', 'patient', 'concept', 'orderer',
                        'orderReason'
                    ]);
                });
                var encounter = {
                    patient: config.patient.uuid, // only submit the UUID because of RESTWS-459
                    encounterType: config.drugOrderEncounterType.uuid, // only submit the UUID because of RESTWS-460
                    location: null, // TODO
                    provider: config.provider.person.uuid, // submit the person because of RESTWS-443
                    orders: orders
                };

                $scope.loading = true;
                EncounterService.saveEncounter(encounter).then(function(result) {
                    location.href = location.href;
                }, function(errorResponse) {
                    emr.errorMessage(errorResponse.data.error.message);
                    $scope.loading = false;
                });
            }


            // functions that affect existing active orders

            $scope.discontinueOrder = function(activeOrder) {
                var dcOrder = activeOrder.createDiscontinueOrder();
                $scope.draftDrugOrders.push(dcOrder);
                $scope.$broadcast('added-dc-order', dcOrder);
            }

            $scope.reviseOrder = function(activeOrder) {
                $scope.newDraftDrugOrder = activeOrder.createRevisionOrder();
            }


            // events

            $scope.$on('added-dc-order', function(dcOrder) {
                $timeout(function() {
                    angular.element('#draft-orders input.dc-reason').last().focus();
                });
            })

        }]);