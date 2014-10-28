(function($, _) {
    window.OpenMRS = window.OpenMRS || {};

    var OpenMRS = window.OpenMRS;

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
            console.log("here");
        }
        $.extend(this, obj);
    }

    OpenMRS.createEmptyDraftOrder = function(careSetting) {
        var obj = $.extend({}, {
            action: 'NEW',
            type: 'drugorder',
            careSetting: careSetting,
            orderer: OpenMRS.drugOrdersConfig.provider,
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

        createDiscontinueOrder: function() {
            return new OpenMRS.DrugOrderModel({
                action: 'DISCONTINUE',
                type: 'drugorder',
                careSetting: this.careSetting,
                orderer: OpenMRS.drugOrdersConfig.provider,
                drug: this.drug,
                previousOrder: this,
                orderReasonNonCoded: ''
            });
        },

        createRevisionOrder: function() {
            var draft = OpenMRS.createEmptyDraftOrder(this.careSetting);
            var copyProperties = _.pick(this,
                'commentToFulfiller', 'drug', 'dosingType', 'numRefills', 'quantity', 'quantityUnits', 'dose',
                'doseUnits', 'frequency', 'asNeeded', 'asNeededCondition', 'route', 'duration', 'durationUnits',
                'dosingInstructions'
            );
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

