<form id="new-order" class="sized-inputs css-form" name="newOrderForm" novalidate>
    <h4>
        {{ draftOrder.action | omrs.display:"orderentryui.action." }}:
        {{ draftOrder.drug | omrs.display}}
    </h4>

    <p ng-show="draftOrder.drug">
        <label class="dosing-type heading">
            <span>Dosing Type:</span>
            <a ng-repeat="dosingType in dosingTypes" tabindex="-1"
               ng-click="draftOrder.dosingType = dosingType.javaClass"
               ng-class="{ active: draftOrder.dosingType == dosingType.javaClass }">
                <i class="{{ dosingType.icon }}"></i>
                {{ dosingType.display }}
            </a>
        </label>

        <span ng-if="draftOrder.dosingType == 'org.openmrs.SimpleDosingInstructions'">
            <input ng-model="draftOrder.dose" type="number" placeholder="Dose" min="0" required/>
            <select-concept-from-list ng-model="draftOrder.doseUnits" concepts="orderContext.config.drugDosingUnits" placeholder="Units" size="5" required></select-concept-from-list>

            <select-order-frequency ng-model="draftOrder.frequency" frequencies="orderContext.config.orderFrequencies" placeholder="Frequency" required></select-order-frequency>

            <select-concept-from-list ng-model="draftOrder.route" concepts="orderContext.config.drugRoutes" placeholder="Route" size="20" required></select-concept-from-list>
            <br/>

            <label ng-class="{ disabled: !draftOrder.asNeededCondition }">As needed for</label>
            <input ng-model="draftOrder.asNeededCondition" type="text" size="30" placeholder="reason (optional)"/>
            <br/>

            <label ng-class="{ disabled: !draftOrder.duration }">For</label>
            <input ng-model="draftOrder.duration" type="number" min="0" placeholder="Duration" />
            <select-concept-from-list ng-model="draftOrder.durationUnits" concepts="orderContext.config.durationUnits" placeholder="Units" size="8" required-if="draftOrder.duration"></select-concept-from-list>
            <label ng-class="{ disabled: !draftOrder.duration }">total</label>
            <br/>
            <textarea ng-model="draftOrder.dosingInstructions" rows="2" cols="60" placeholder="Additional instruction not covered above"></textarea>
        </span>

        <span ng-if="draftOrder.dosingType == 'org.openmrs.FreeTextDosingInstructions'">
            <textarea ng-model="draftOrder.dosingInstructions" rows="4" cols="60" placeholder="Complete instructions"></textarea>
        </span>
    </p>

    <p ng-if="draftOrder.drug && draftOrder.careSetting.careSettingType == 'OUTPATIENT'">
        <label class="heading">For outpatient orders</label>
        Dispense:
        <input ng-model="draftOrder.quantity" type="number" min="0" placeholder="Quantity" required/>
        <select-concept-from-list ng-model="draftOrder.quantityUnits" concepts="orderContext.config.drugDispensingUnits" placeholder="Units" size="8"></select-concept-from-list>
    </p>

    <p ng-show="draftOrder.drug">
        <button type="submit" class="confirm right" ng-disabled="newOrderForm.\$invalid" ng-click="readyDraft(draftOrder)">Add</button>
        <button class="cancel" ng-click="cancelDraft(draftOrder)">Cancel</button>
    </p>
</form>