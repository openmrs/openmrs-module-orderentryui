(function($, _) {
    window.OpenMRS = window.OpenMRS || {};

    var OpenMRS = window.OpenMRS;

    // helper to use a fuller representation rather than a ref one
    function replaceWithReferenceData(object, property, referenceList) {
        var ref = object[property];
        if (ref) {
            var replacement = _.findWhere(referenceList, {uuid: ref.uuid});
            if (replacement) {
                object[property] = replacement;
            }
        }
    }

    OpenMRS.snomedCodes = {
        tablet: "385055001",
        capsule: "428641000",

        oralAdministration: "26643006"
    }

    OpenMRS.dosingTypes = [
        {
            display: 'Standard Dosing',
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
                var valid = order.drug && order.dose && order.doseUnits && order.frequency && order.route;
                if (order.careSetting.careSettingType === 'OUTPATIENT') {
                    valid = valid && order.quantity && order.quantityUnits;
                }
                return valid;
            },
            cleanup: function(order) {
                order.asNeeded = order.asNeededCondition ? true : false;
            },
            format: function(order) {
                var str = order.drug.display + ": " +
                    order.dose + " " + order.doseUnits.display + ", " +
                    order.frequency.display + ", " +
                    order.route.display +
                    (order.asNeeded ? ", as needed" + (order.asNeededCondition ? " for " + order.asNeededCondition : "") : "");
                if (order.duration) {
                    str += ", for " + order.duration + " " + order.durationUnits.display + " total";
                }
                if (order.dosingInstructions) {
                    str += " (" + order.dosingInstructions + ")";
                }
                return str;
            },
            inferFields: function(order, orderContext) {
                if (!order.drug || !order.drug.dosageForm || !orderContext || !orderContext.config) {
                    return;
                }
                // if drug.dosageForm is Tablet => route = Oral, dose = Tablet
                var sameDoseUnitAsForm = false;
                if (emr.hasMapping(order.drug.dosageForm, "SNOMED CT", OpenMRS.snomedCodes.tablet)) {
                    if (!order.route) {
                        order.route = emr.findConceptWithMapping(orderContext.config.drugRoutes, "SNOMED CT", OpenMRS.snomedCodes.oralAdministration);
                    }
                    sameDoseUnitAsForm = true;
                }
                if (sameDoseUnitAsForm && !order.doseUnits) {
                    order.doseUnits = _.findWhere(orderContext.config.drugDosingUnits, {uuid: order.drug.dosageForm.uuid});
                }
            }
        },
        {
            display: 'Free Text',
            icon: 'icon-edit',
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

    OpenMRS.DrugOrderModel = function(obj) {
        if (obj === undefined) {
            console.log("Error: null obj");
        }
        $.extend(this, obj);
    }

    OpenMRS.createEmptyDraftOrder = function(orderContext) {
        var obj = $.extend({}, {
            editing: true,
            action: 'NEW',
            type: 'drugorder',
            careSetting: orderContext.careSetting,
            orderer: orderContext.provider,
            commentToFulfiller: '',
            drug: '',
            dosingType: 'org.openmrs.SimpleDosingInstructions',
            numRefills: 0,
            quantity: null,
            quantityUnits: null,
            previousOrder: null
        });
        _.each(OpenMRS.dosingTypes, function(value) {
            $.extend(obj, value.defaults);
        });
        return new OpenMRS.DrugOrderModel(obj);
    }

    OpenMRS.DrugOrderModel.prototype = {

        constructor: OpenMRS.DrugOrderModel,

        inferFields: function(orderContext) {
            var dt = this.getDosingType();
            if (dt && dt.inferFields) {
                dt.inferFields(this, orderContext);
            }
        },

        createDiscontinueOrder: function(orderContext) {
            return new OpenMRS.DrugOrderModel({
                action: 'DISCONTINUE',
                type: 'drugorder',
                careSetting: this.careSetting,
                orderer: orderContext.provider,
                drug: this.drug,
                previousOrder: this,
                orderReasonNonCoded: ''
            });
        },

        createRevisionOrder: function(orderContext) {
            var draft = OpenMRS.createEmptyDraftOrder(this.careSetting);
            var copyProperties = _.pick(this,
                'commentToFulfiller', 'drug', 'dosingType', 'numRefills', 'quantity', 'quantityUnits', 'dose',
                'doseUnits', 'frequency', 'asNeeded', 'asNeededCondition', 'route', 'duration', 'durationUnits',
                'dosingInstructions', 'careSetting'
            );
            if (orderContext && orderContext.config) {
                replaceWithReferenceData(copyProperties, 'quantityUnits', orderContext.config.drugDispensingUnits);
                replaceWithReferenceData(copyProperties, 'doseUnits', orderContext.config.drugDosingUnits);
                replaceWithReferenceData(copyProperties, 'frequency', orderContext.config.orderFrequencies);
                replaceWithReferenceData(copyProperties, 'route', orderContext.config.drugRoutes);
                replaceWithReferenceData(copyProperties, 'durationUnits', orderContext.config.durationUnits);
                replaceWithReferenceData(copyProperties, 'doseUnits', orderContext.config.drugDosingUnits);
            }
            var override = {
                action: 'REVISE',
                previousOrder: this
            };
            $.extend(draft, copyProperties, override);
            return draft;
        },

        getDosingType: function() {
            return _.findWhere(OpenMRS.dosingTypes, { javaClass: this.dosingType });
        }
    };

})(jQuery, _);

