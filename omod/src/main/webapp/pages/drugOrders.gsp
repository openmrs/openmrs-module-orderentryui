<%
ui.decorateWith("appui", "standardEmrPage")

ui.includeJavascript("uicommons", "angular.min.js")
ui.includeJavascript("uicommons", "angular-app.js")
ui.includeJavascript("uicommons", "angular-resource.min.js")
ui.includeJavascript("uicommons", "angular-common.js")
ui.includeJavascript("uicommons", "angular-ui/ui-bootstrap-tpls-0.11.2.js")
ui.includeJavascript("uicommons", "ngDialog/ngDialog.js")
ui.includeJavascript("uicommons", "filters/display.js")
ui.includeJavascript("uicommons", "filters/serverDate.js")
ui.includeJavascript("uicommons", "services/conceptService.js")
ui.includeJavascript("uicommons", "services/drugService.js")
ui.includeJavascript("uicommons", "services/encounterService.js")
ui.includeJavascript("uicommons", "services/orderService.js")
ui.includeJavascript("uicommons", "services/session.js")
ui.includeJavascript("uicommons", "directives/select-concept-from-list.js")
ui.includeJavascript("uicommons", "directives/select-order-frequency.js")
ui.includeJavascript("uicommons", "directives/select-drug.js")
ui.includeJavascript("orderentryui", "order-model.js")
ui.includeJavascript("orderentryui", "order-entry.js")
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

${ ui.includeFragment("appui", "messages", [ codes: [
"orderentryui.pastAction.REVISE",
"orderentryui.pastAction.DISCONTINUE"
] ])}

${ ui.includeFragment("coreapps", "patientHeader", [ patient: patient ]) }

<div id="drug-orders-app" ng-controller="DrugOrdersCtrl" ng-init='init()'>
    <div class="ui-tabs">
        <ul style="display:none;" class="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header">
            <li ng-repeat="setting in careSettings" class="ui-state-default ui-corner-top"
            ng-class="{ 'ui-tabs-active': setting == careSetting, 'ui-state-active': setting == careSetting }">
            <a class="ui-tabs-anchor" ng-click="setCareSetting(setting)">
                {{ setting | omrs.display }}
            </a>
        </li>
    </ul>

    <div class="ui-tabs-panel ui-widget-content">

        <oeui-entry>
    </oeui-entry>

    <div id="orders-list" style="display:none;">
        <h3>Active Drug Orders</h3>
        <span ng-show="activeDrugOrders.loading">${ ui.message("uicommons.loading.placeholder") }</span>
        <span ng-hide="activeDrugOrders.loading || activeDrugOrders.length > 0">None</span>
        <table ng-hide="activeDrugOrders.loading">
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
        <span ng-show="pastDrugOrders.loading">${ ui.message("uicommons.loading.placeholder") }</span>
        <span ng-hide="pastDrugOrders.loading || pastDrugOrders.length > 0">None</span>
        <table id="past-drug-orders" ng-hide="pastDrugOrders.loading">
            <tr ng-repeat="order in pastDrugOrders">
                <td>
                    {{ replacementForPastOrder(order) | replacement }}
                </td>
                <td>
                    {{ order | dates }}
                </td>
                <td>
                    {{ order | instructions }}
                </td>
            </tr>
        </table>
    </div>
</div>

</div>

<script type="text/javascript">
    // manually bootstrap angular app, in case there are multiple angular apps on a page
    angular.bootstrap('#drug-orders-app', ['drugOrders']);
</script>