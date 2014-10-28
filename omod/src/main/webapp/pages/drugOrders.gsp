<%
    ui.decorateWith("appui", "standardEmrPage")

    ui.includeJavascript("uicommons", "angular.min.js")
    ui.includeJavascript("uicommons", "angular-app.js")
    ui.includeJavascript("uicommons", "angular-resource.min.js")
    ui.includeJavascript("uicommons", "angular-common.js")
    ui.includeJavascript("uicommons", "angular-ui/ui-bootstrap-tpls-0.6.0.min.js")
    ui.includeJavascript("uicommons", "ngDialog/ngDialog.js")
    ui.includeJavascript("uicommons", "filters/display.js")
    ui.includeJavascript("uicommons", "services/conceptService.js")
    ui.includeJavascript("uicommons", "services/drugService.js")
    ui.includeJavascript("uicommons", "services/encounterService.js")
    ui.includeJavascript("uicommons", "services/orderService.js")
    ui.includeJavascript("uicommons", "directives/select-concept-from-list.js")
    ui.includeJavascript("uicommons", "directives/select-order-frequency.js")
    ui.includeJavascript("uicommons", "directives/select-drug.js")
    ui.includeJavascript("orderentryui", "drugOrderModel.js")
    ui.includeJavascript("orderentryui", "drugOrders.js")

    ui.includeCss("uicommons", "ngDialog/ngDialog.min.css")
    ui.includeCss("orderentryui", "drugOrders.css")
%>
<script type="text/javascript">
    var breadcrumbs = [
        { icon: "icon-home", link: '/' + OPENMRS_CONTEXT_PATH + '/index.htm' },
        { label: "${ ui.format(patient.familyName) }, ${ ui.format(patient.givenName) }" ,
            link: '${ui.pageLink("coreapps", "clinicianfacing/patient", [patientId: patient.id])}'},
        { label: "Drug Orders" }
    ]
    window.OpenMRS = window.OpenMRS || {};
    window.OpenMRS.drugOrdersConfig = ${ jsonConfig };
</script>

${ ui.includeFragment("coreapps", "patientHeader", [ patient: patient ]) }

<div id="drug-orders-app" ng-controller="DrugOrdersCtrl" ng-init='init()'>
    <div class="ui-tabs">
        <ul class="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header">
            <li ng-repeat="setting in careSettings" class="ui-state-default ui-corner-top"
                ng-class="{ 'ui-tabs-active': setting == careSetting, 'ui-state-active': setting == careSetting }">
                    <a class="ui-tabs-anchor" ng-click="setCareSetting(setting)">
                        {{ setting | omrs.display }}
                    </a>
            </li>
        </ul>

        <div class="ui-tabs-panel ui-widget-content">

            <form id="new-order" class="sized-inputs" name="newOrderForm" novalidate>
                <p>
                    <span ng-show="newDraftDrugOrder.action === 'NEW'">
                        <label>New order for:</label>
                        <select-drug ng-model="newDraftDrugOrder.drug" placeholder="Drug" size="40" required></select-drug>
                    </span>
                    <strong ng-show="newDraftDrugOrder.action === 'REVISE'">
                        Revised order for: {{ newDraftDrugOrder.drug.display }}
                    </strong>
                </p>

                <p ng-show="newDraftDrugOrder.drug">
                    <label class="heading instructions">
                        <span>Instructions</span>
                        <a ng-repeat="dosingType in dosingTypes" tabindex="-1"
                           ng-click="newDraftDrugOrder.dosingType = dosingType.javaClass"
                           ng-class="{ active: newDraftDrugOrder.dosingType == dosingType.javaClass }">
                            <i class="{{ dosingType.icon }}"></i>
                            {{ dosingType.display }}
                        </a>
                    </label>

                    <span ng-show="newDraftDrugOrder.dosingType == 'org.openmrs.SimpleDosingInstructions'">
                        <input ng-model="newDraftDrugOrder.dose" type="text" size="5" placeholder="Dose"/>
                        <select-concept-from-list ng-model="newDraftDrugOrder.doseUnits" concepts="doseUnits" placeholder="Units" size="5" ></select-concept-from-list>
                        <select-order-frequency ng-model="newDraftDrugOrder.frequency" frequencies="frequencies" placeholder="Frequency" ></select-order-frequency>
                        <select-concept-from-list ng-model="newDraftDrugOrder.route" concepts="routes" placeholder="Route" size="20"></select-concept-from-list>
                        <br/>

                        <label ng-class="{ disabled: !newDraftDrugOrder.asNeededCondition }">As needed for</label>
                        <input ng-model="newDraftDrugOrder.asNeededCondition" type="text" size="30" placeholder="reason (optional)"/>
                        <br/>

                        for
                        <input ng-model="newDraftDrugOrder.duration" type="text" size="5" placeholder="Duration" />
                        <select-concept-from-list ng-model="newDraftDrugOrder.durationUnits" concepts="durationUnits" placeholder="Units" size="5" ></select-concept-from-list>
                        total

                        <br/>
                        <textarea ng-model="newDraftDrugOrder.dosingInstructions" rows="2" cols="60" placeholder="Additional instruction not covered above"></textarea>
                    </span>

                    <span ng-show="newDraftDrugOrder.dosingType == 'org.openmrs.FreeTextDosingInstructions'">
                        <textarea ng-model="newDraftDrugOrder.dosingInstructions" rows="4" cols="60" placeholder="Complete instructions"></textarea>
                    </span>
                </p>

                <p ng-show="newDraftDrugOrder.drug && careSetting.careSettingType == 'OUTPATIENT'">
                    <label class="heading">For outpatient orders</label>
                    Dispense:
                    <input ng-model="newDraftDrugOrder.quantity" type="text" size="5" placeholder="Quantity" />
                    <select-concept-from-list ng-model="newDraftDrugOrder.quantityUnits" concepts="quantityUnits" placeholder="Units" size="5"></select-concept-from-list>
                </p>

                <p ng-show="newDraftDrugOrder.drug">
                    <button type="submit" class="confirm right" ng-click="addNewDraftOrder()">Add</button>
                    <button class="cancel" ng-click="cancelNewDraftOrder()">Cancel</button>
                </p>
            </form>

            <div id="draft-orders" ng-show="draftDrugOrders.length > 0">
                <h3>Unsaved Draft Orders ({{ draftDrugOrders.length }})</h3>
                <table>
                    <tr class="draft-order" ng-repeat="order in draftDrugOrders">
                        <td>
                            {{ order.action }}
                            {{ order | dates }}
                        </td>
                        <td>
                            {{ order | instructions }}
                            <span ng-show="order.action == 'DISCONTINUE'">
                                <br/>
                                For: <input ng-model="order.orderReasonNonCoded" class="dc-reason" type="text" placeholder="reason" size="40"/>
                            </span>
                        </td>
                        <td class="actions">
                            <a ng-click="editDraftDrugOrder(order)"><i class="icon-pencil edit-action"></i></a>
                            <a ng-click="cancelDraftDrugOrder(order)"><i class="icon-remove delete-action"></i></a>
                        </td>
                    </tr>
                </table>

                <div class="actions">
                    <div class="signature">
                        Signing as ${ ui.format(sessionContext.currentProvider) } on (auto-generated timestamp)
                    </div>
                    <button class="confirm right" ng-click="signAndSaveDraftDrugOrders()">Sign and Save</button>
                    <button class="cancel" ng-click="cancelAllDraftDrugOrders()">
                        {{ draftDrugOrders.length > 1 ? "Discard All" : "Discard" }}
                    </button>
                </div>
            </div>

            <h3>Active Drug Orders</h3>
            <span ng-hide="activeDrugOrders.length > 0">None</span>
            <table>
                <tr ng-repeat="order in activeDrugOrders">
                    <td ng-class="{ 'will-replace': replacementFor(order) }">
                        {{ order | dates }}
                    </td>
                    <td ng-class="{ 'will-replace': replacementFor(order) }">
                        {{ order | instructions }}
                    </td>
                    <td class="actions">
                        <a ng-show="!replacementFor(order)" ng-click="reviseOrder(order)">
                            <i class="icon-pencil edit-action"></i>
                        </a>
                        <a ng-show="!replacementFor(order)" ng-click="discontinueOrder(order)">
                            <i class="icon-remove delete-action"></i>
                        </a>
                        <span ng-show="replacementFor(order)">
                            will {{ replacementFor(order).action }}
                        </span>
                    </td>
                </tr>
            </table>

            <h3>Past Drug Orders</h3>
            To Do
        </div>
    </div>

</div>

<script type="text/javascript">
    // manually bootstrap angular app, in case there are multiple angular apps on a page
    angular.bootstrap('#drug-orders-app', ['drugOrders']);
</script>