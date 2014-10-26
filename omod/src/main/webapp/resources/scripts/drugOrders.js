angular.module('drugOrders', ['orderService', 'encounterService', 'uicommons.filters', 'uicommons.widget.select-concept-from-list',
    'uicommons.widget.select-order-frequency', 'uicommons.widget.select-drug']).

    config(function($locationProvider) {
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
    }).

    controller('DrugOrdersCtrl', ['$scope', '$window', '$location', '$timeout', 'OrderService', 'EncounterService',
        function($scope, $window, $location, $timeout, OrderService, EncounterService) {

            // TODO changing dosingType of a draft order should reset defaults (and discard non-defaulted properties)
            var dosingTypes = [
                {
                    display: 'Simple Coded',
                    icon: 'icon-th-large',
                    javaClass: 'org.openmrs.SimpleDosingInstructions',
                    defaults: {
                        dose: null,
                        doseUnits: null,
                        frequency: null,
                        asNeeded: false, // we won't display this in the UI but will set it based on asNeededCondition
                        asNeededCondition: null,
                        route: null,
                        duration: null,
                        durationUnits: null,
                        dosingInstructions: null
                    },
                    validate: function(order) {
                        return order.drug && order.dose && order.doseUnits && order.frequency && order.route && order.duration && order.durationUnits;
                    },
                    format: function(order) {
                        var str = order.drug.display + ": " +
                            order.dose + " " + order.doseUnits.display + ", " +
                            order.frequency.display + ", " +
                            order.route.display +
                            (order.asNeeded ? ", as needed" + (order.asNeededCondition ? " for " + order.asNeededCondition : "") : "") +
                            ", for " +
                            order.duration + " " + order.durationUnits.display +
                            (order.dosingInstructions ? " (" + order.dosingInstructions + ")" : "");
                        return str;
                    }
                },
                {
                    display: 'Free Text',
                    icon: 'icon-file-alt',
                    javaClass: 'org.openmrs.FreeTextDosingInstructions',
                    defaults: {
                        dosingInstructions: '',
                        autoExpireDate: null
                    },
                    validate: function(order) {
                        return order.dosingInstructions;
                    },
                    format: function(order) {
                        return order.drug.display + ": \"" + order.dosingInstructions + "\"";
                    }
                }
            ];

            function getDosingType(order) {
                return _.findWhere($scope.dosingTypes, { javaClass: order.dosingType });
            }

            function formatDate(isoString) {
                return new Date(isoString).toLocaleString();
            }

            function loadExistingOrders() {
                OrderService.getOrders({
                    t: 'drugorder',
                    v: 'full',
                    patient: config.patient.uuid,
                    careSetting: $scope.careSetting.uuid
                }).then(function(results) {
                    // this REST call only gives active orders, which seems like a bug
                    $scope.activeDrugOrders = results;
                    // TODO get past orders
                });
            }

            function careSettingChanged(fromCareSetting, toCareSetting) {
                // TODO confirm dialog or undo functionality if this is going to discard things
                loadExistingOrders();
                $scope.draftDrugOrders = [];
                $scope.newDraftDrugOrder = createEmptyDraftOrder();
                $location.search({ patient: config.patient.uuid, careSetting: toCareSetting.uuid });
            }

            function createEmptyDraftOrder() {
                // hopefully these can be inferred: encounter, patient, concept, dateActivated
                var order = angular.extend({}, {
                    action: 'NEW',
                    type: 'drugorder',
                    careSetting: $scope.careSetting,
                    orderer: config.provider,
                    commentToFulfiller: '',
                    drug: '',
                    dosingType: 'org.openmrs.SimpleDosingInstructions',
                    numRefills: 0,
                    quantity: null,
                    quantityUnits: null,
                    previousOrder: null
                });
                _.each($scope.dosingTypes, function(value) {
                    angular.extend(order, value.defaults);
                });
                return order;
            }

            function createDiscontinueOrderFor(activeOrder) {
                return {
                    action: 'DISCONTINUE',
                    type: 'drugorder',
                    careSetting: $scope.careSetting,
                    orderer: config.provider,
                    drug: activeOrder.drug,
                    previousOrder: activeOrder,
                    orderReasonNonCoded: ''
                };
            }

            function createReviseOrderFor(activeOrder) {
                var obj = angular.extend(
                    createEmptyDraftOrder(),
                    _.pick(activeOrder,
                        'commentToFulfiller', 'drug', 'dosingType', 'numRefills', 'quantity', 'quantityUnits', 'dose',
                        'doseUnits', 'frequency', 'asNeeded', 'asNeededCondition', 'route', 'duration', 'durationUnits',
                        'dosingInstructions'
                    ), {
                        action: 'REVISE',
                        previousOrder: activeOrder
                    }
                );
                return obj;
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


            $scope.activeDrugOrders = [];
            $scope.pastDrugOrders = [];
            $scope.draftDrugOrders = [];
            $scope.dosingTypes = dosingTypes;

            var config = {};
            $scope.init = function() {
                angular.extend(config, $window.drugOrdersConfig);
                $scope.routes = config.routes;
                $scope.doseUnits = config.doseUnits;
                $scope.durationUnits = config.durationUnits;
                $scope.quantityUnits = config.quantityUnits;
                $scope.frequencies = config.frequencies;
                $scope.careSettings = config.careSettings;
                $scope.careSetting = config.intialCareSetting ?
                    _.findWhere(config.careSettings, { uuid: config.intialCareSetting }) :
                    config.careSettings[0];

                $scope.newDraftDrugOrder = createEmptyDraftOrder();

                loadExistingOrders();

                $timeout(function() {
                    angular.element('#new-order input[type=text]').first().focus();
                });
            }


            // functions that affect the overall state of the page

            $scope.setCareSetting = function(careSetting) {
                var oldCareSetting = $scope.careSetting
                if (oldCareSetting != careSetting) {
                    $scope.careSetting = careSetting;
                    careSettingChanged(oldCareSetting, careSetting);
                }
            }


            // functions that affect the new order being written

            $scope.addNewDraftOrder = function() {
                if (getDosingType($scope.newDraftDrugOrder).validate($scope.newDraftDrugOrder)) {
                    $scope.newDraftDrugOrder.asNeeded = $scope.newDraftDrugOrder.asNeededCondition ? true : false;
                    $scope.draftDrugOrders.push($scope.newDraftDrugOrder);
                    $scope.newDraftDrugOrder = createEmptyDraftOrder();
                    $scope.newOrderForm.$setPristine();
                    // TODO upgrade to angular 1.3 and work on form validation
                    // $scope.newOrderForm.$setUntouched();
                } else {
                    emr.errorMessage("Invalid");
                }
            }

            $scope.cancelNewDraftOrder = function() {
                $scope.newDraftDrugOrder = createEmptyDraftOrder();
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

                EncounterService.saveEncounter(encounter).then(function(result) {
                    location.href = location.href;
                }, function(errorResponse) {
                    emr.errorMessage(errorResponse.data.error.message);
                });
            }


            // functions that affect existing active orders

            $scope.discontinueOrder = function(activeOrder) {
                var dcOrder = createDiscontinueOrderFor(activeOrder);
                $scope.draftDrugOrders.push(dcOrder);
                $scope.$broadcast('added-dc-order', dcOrder);
            }

            $scope.reviseOrder = function(activeOrder) {
                $scope.newDraftDrugOrder = createReviseOrderFor(activeOrder);
            }


            // formatting

            $scope.formatActionAndDates = function(order) {
                if (order.action == 'DISCONTINUE') {
                    return "DC";
                } else {
                    var text = order.action;
                    if (order.dateActivated) {
                        text += ' ' + formatDate(order.dateActivated);
                        if (order.autoExpireDate) {
                            text += ' - ' + formatDate(order.autoExpireDate);
                        }
                    }
                    return text;
                }
            }

            $scope.formatOrder = function(order) {
                if (order.action == 'DISCONTINUE') {
                    return "Discontinue " + order.drug.display;
                } else {
                    var text = getDosingType(order).format(order);
                    if (order.quantity) {
                        text += ' (' + order.quantity + ' ' + order.quantityUnits.display + ')';
                    }
                    return text;
                }
            }


            // events

            $scope.$on('added-dc-order', function(dcOrder) {
                $timeout(function() {
                    angular.element('#draft-orders input.dc-reason').last().focus();
                });
            })

        }]);