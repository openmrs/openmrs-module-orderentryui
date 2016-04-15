<form id="new-order" class="sized-inputs css-form" name="newOrderForm" novalidate>
	<p>
		<span ng-show="newDraftDrugOrder.action === 'NEW'">
			<label>New order for:</label>
			<select-drug ng-model="newDraftDrugOrder.drug" placeholder="Drug" size="40"></select-drug>
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

	<span ng-if="newDraftDrugOrder.dosingType == 'org.openmrs.SimpleDosingInstructions'">
		<input ng-model="newDraftDrugOrder.dose" type="number" placeholder="Dose" min="0" required/>
		<select-concept-from-list ng-model="newDraftDrugOrder.doseUnits" concepts="doseUnits" placeholder="Units" size="5" required></select-concept-from-list>

		<select-order-frequency ng-model="newDraftDrugOrder.frequency" frequencies="frequencies" placeholder="Frequency" required></select-order-frequency>

		<select-concept-from-list ng-model="newDraftDrugOrder.route" concepts="routes" placeholder="Route" size="20" required></select-concept-from-list>
		<br/>

		<label ng-class="{ disabled: !newDraftDrugOrder.asNeededCondition }">As needed for</label>
		<input ng-model="newDraftDrugOrder.asNeededCondition" type="text" size="30" placeholder="reason (optional)"/>
		<br/>

		<label ng-class="{ disabled: !newDraftDrugOrder.duration }">For</label>
		<input ng-model="newDraftDrugOrder.duration" type="number" min="0" placeholder="Duration" />
		<select-concept-from-list ng-model="newDraftDrugOrder.durationUnits" concepts="durationUnits" placeholder="Units" size="8" required-if="newDraftDrugOrder.duration"></select-concept-from-list>
		<label ng-class="{ disabled: !newDraftDrugOrder.duration }">total</label>
		<br/>
		<textarea ng-model="newDraftDrugOrder.dosingInstructions" rows="2" cols="60" placeholder="Additional instruction not covered above"></textarea>
	</span>

	<span ng-if="newDraftDrugOrder.dosingType == 'org.openmrs.FreeTextDosingInstructions'">
		<textarea ng-model="newDraftDrugOrder.dosingInstructions" rows="4" cols="60" placeholder="Complete instructions"></textarea>
	</span>
</p>

<p ng-if="newDraftDrugOrder.drug && careSetting.careSettingType == 'OUTPATIENT'">
	<label class="heading">For outpatient orders</label>
	Dispense:
	<input ng-model="newDraftDrugOrder.quantity" type="number" min="0" placeholder="Quantity" required/>
	<select-concept-from-list ng-model="newDraftDrugOrder.quantityUnits" concepts="quantityUnits" placeholder="Units" size="8"></select-concept-from-list>
</p>

<p ng-show="newDraftDrugOrder.drug">
	<button type="submit" class="confirm right" ng-disabled="newOrderForm.\$invalid" ng-click="addNewDraftOrder()">Add</button>
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
			<img ng-show="loading" src="${ ui.resourceLink("uicommons", "images/spinner.gif") }"/>
		</div>
		<button class="confirm right" ng-disabled="loading" ng-click="signAndSaveDraftDrugOrders()">Sign and Save</button>
		<button class="cancel" ng-click="cancelAllDraftDrugOrders()">
			{{ draftDrugOrders.length > 1 ? "Discard All" : "Discard" }}
		</button>
	</div>
</div>
