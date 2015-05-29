angular.module("orderEntry", ['orderService', 'encounterService', 'session'])

    .factory("CareSetting", [ "$resource", function($resource) {
        return $resource("/" + OPENMRS_CONTEXT_PATH  + "/ws/rest/v1/caresetting/:uuid", {
        },{
            query: { method:'GET' }     // override query method to specify that it isn't an array that is returned
        });
    }])

    .factory("OrderEntryConfig", [ "$resource", function($resource) {
        return $resource("/" + OPENMRS_CONTEXT_PATH  + "/ws/rest/v1/orderentryconfig");
    }])

    .factory("OrderFrequency", [ "$resource", function($resource) {
        return $resource("/" + OPENMRS_CONTEXT_PATH  + "/ws/rest/v1/orderfrequency/:uuid", {
                uuid: '@uuid'
            }, {
                query: { method:'GET' }
            });
    }])

    .factory("OrderContext", [ "$q", "SessionInfo", "OrderEntryConfig", "OrderFrequency", function($q, SessionInfo, OrderEntryConfig, OrderFrequency) {
        function addAll(fromArray, toArray) {
            for (var i = 0, len = fromArray.length; i < len; ++i) {
                toArray.push(fromArray[i]);
            }
        }

        var orderContext = {
            patient: null,
            careSetting: null,
            session: SessionInfo.get(),
            config: {
                orderFrequencies: [],
                drugRoutes: [],
                drugDosingUnits: [],
                drugDispensingUnits: [],
                durationUnits: [],
                testSpecimenSources: []
            },
            draftOrders: [],
            draftData: {}
        };

        var of = OrderFrequency.get({v:"fullconcept"});
        orderContext.config.orderFrequencies.$promise = of.$promise.then(function(response) {
            // TODO load more pages if necessary
            return response.results;
        });
        of.$promise.then(function(response) {
            // TODO load more pages if necessary
            addAll(response.results, orderContext.config.orderFrequencies);
        });

        var oec = OrderEntryConfig.get({v:"full"});
        function configPropertyHelper(configProp) {
            var defer = $q.defer();
            var target = orderContext.config[configProp];
            target.$promise = defer.promise;
            oec.$promise.then(function(orderEntryConfig) {
                addAll(orderEntryConfig[configProp], target);
                defer.resolve(target);
            });
        }
        configPropertyHelper("drugRoutes");
        configPropertyHelper("drugDosingUnits");
        configPropertyHelper("drugDispensingUnits");
        configPropertyHelper("durationUnits");
        configPropertyHelper("testSpecimenSources");

        var deferred = $q.defer();
        orderContext.$promise = deferred.promise;

        function maybeSignalReady() {
            if (orderContext.patient && orderContext.careSetting && orderContext.session.$resolved) {
                deferred.resolve(orderContext);
            }
        }

        orderContext.session.$promise.then(function() {
            maybeSignalReady();
        })

        return {
            get: function() {
                return orderContext;
            },
            setPatient: function(patient) {
                orderContext.patient = patient;
                maybeSignalReady();
            },
            setCareSetting: function(careSetting) {
                orderContext.careSetting = careSetting;
                maybeSignalReady();
            },
            addDraftOrder: function(draftOrder) {
                if (!_.contains(orderContext.draftOrders, draftOrder)) {
                    orderContext.draftOrders.push(draftOrder);
                }
            },
            cancelDraftOrder: function(draftOrder) {
                var index = orderContext.draftOrders.indexOf(draftOrder);
                if (index >= 0) {
                    orderContext.draftOrders.splice(index, 1);
                }
            },
            // draftDataToObsMapper needs to convert a single argument (draftData) to an array of obs.
            // If no function is passed in, we presume that any non-null-valued field in draftData needs to be saved
            hasUnsavedData: function(draftDataToObsMapper) {
                return orderContext.draftOrders.length > 0 ||
                    (draftDataToObsMapper && draftDataToObsMapper(orderContext.draftData).length > 0) ||
                    (!draftDataToObsMapper && _.some(_.values(orderContext.draftData)));
            },
            canSaveDrafts: function() {
                return this.hasUnsavedData() &&
                    _.every(orderContext.draftOrders, function(it) {
                        if (it.editing) {
                            return false;
                        }
                        if (it.getDosingType) { // it's a drug order
                            var dosingType = it.getDosingType();
                            return !dosingType || dosingType.validate(it);
                        }
                        return true;
                    });
            }
        }
    }])

    .factory("OrderEntryService", [ "$rootScope", "$q", "Order", "Encounter", "SessionInfo", function($rootScope, $q, Order, Encounter, SessionInfo) {

        function replaceWithUuids(obj, props) {
            var replaced = angular.extend({}, obj);
            _.each(props, function(prop) {
                if (replaced[prop] && replaced[prop].uuid) {
                    replaced[prop] = replaced[prop].uuid;
                }
            });
            return replaced;
        }

        function uuidIfNotNull(obj) {
            return obj ? obj.uuid : null;
        }

        return {
            getOrdersForEncounter: function(encounterRef) {
                var ret = [];
                var deferred = $q.defer();
                ret.$promise = deferred.promise;
                ret.$resolved = false;
                Encounter.get({ uuid: encounterRef.uuid, v: "custom:(orders:full)" })
                    .$promise.then(function(encounter) {
                        _.each(encounter.orders, function(it) {
                            // TODO handle non-drug orders
                            ret.push(new OpenMRS.DrugOrderModel(it));
                        });
                        deferred.resolve(ret);
                        ret.$resolved = true;
                    });
                return ret;
            },
            getActiveDrugOrders: function(patient, careSetting) {
                var ret = [];
                var deferred = $q.defer();
                ret.$promise = deferred.promise;
                ret.$resolved = false;
                Order.query({
                    t: "drugorder",
                    v: "full",
                    patient: patient.uuid,
                    careSetting: careSetting.uuid
                }).$promise.then(
                    function(response) {
                        _.each(response.results, function(item) {
                            ret.push(new OpenMRS.DrugOrderModel(item));
                        });
                        // TODO check where there are more pages of results
                        deferred.resolve(ret);
                        ret.$resolved = true;
                    },
                    function(reason) {
                        ret.$promise.reject(reason);
                    });
                return ret;
            },

            getPastDrugOrders: function(patient, careSetting) {
                var ret = [];
                var deferred = $q.defer();
                ret.$promise = deferred.promise;
                ret.$resolved = false;
                Order.query({
                    t: "drugorder",
                    v: "full",
                    patient: patient.uuid,
                    careSetting: careSetting.uuid,
                    status: 'inactive'
                }).$promise.then(
                    function(response) {
                        _.each(response.results, function(item) {
                            ret.push(new OpenMRS.DrugOrderModel(item));
                        });
                        // TODO check where there are more pages of results
                        deferred.resolve(ret);
                        ret.$resolved = true;
                    },
                    function(reason) {
                        ret.promise.reject(reason);
                    });
                return ret;
            },

            signAndSave: function(orderContext, encounterContext, obs) {
                var provider = SessionInfo.get().currentProvider;
                _.each(orderContext.draftOrders, function(it) {
                    if (it.getDosingType && it.getDosingType() && it.getDosingType().cleanup) {
                        it.getDosingType().cleanup(it);
                    }
                });
                var orders = _.map(orderContext.draftOrders, function(order) {
                    var transformed = replaceWithUuids(order, ['drug', 'doseUnits', 'frequency', 'quantityUnits',
                        'durationUnits', 'route', 'previousOrder', 'careSetting', 'patient', 'concept', 'orderer',
                        'orderReason'
                    ]);
                    if (!transformed.orderer) {
                        transformed.orderer = provider.uuid;
                    }
                    delete transformed.editing;
                    return transformed;
                });
                var encounter = {
                    patient: encounterContext.patient.uuid,
                    encounterType: encounterContext.encounterType.uuid,
                    visit: uuidIfNotNull(encounterContext.visit),
                    location: uuidIfNotNull(encounterContext.location),
                    provider: provider.person.uuid, // submit the person because of RESTWS-443
                    orders: orders,
                };
                if (obs) {
                    encounter.obs = _.map(obs, function(it) {
                        return replaceWithUuids(it, ["concept", "value"]);
                    });
                }
                // If we don't specify the encounter datetime here, the server will default to now().
                // (If this is for a past visit with a stopDatetime, this will fail.)
                if (encounterContext.encounterDatetime) {
                    encounter.encounterDatetime = encounterContext.encounterDatetime;
                }

                var saved = Encounter.save(encounter);
                saved.$promise.then(function(encounter) {
                    $rootScope.$broadcast("visit-changed", encounter.visit);
                });
                return saved;
            }
        }
    }]);