/**
 * The contents of this file are subject to the OpenMRS Public License
 * Version 1.0 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://license.openmrs.org
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 *
 * Copyright (C) OpenMRS, LLC.  All Rights Reserved.
 */
package org.openmrs.module.orderentryui;


import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.Concept;
import org.openmrs.ConceptAnswer;
import org.openmrs.GlobalProperty;
import org.openmrs.OrderFrequency;
import org.openmrs.api.AdministrationService;
import org.openmrs.api.ConceptService;
import org.openmrs.api.OrderService;
import org.openmrs.api.context.Context;
import org.openmrs.module.BaseModuleActivator;
import org.openmrs.util.OpenmrsConstants;

/**
 * This class contains the logic that is run every time this module is either started or stopped.
 */
public class OrderEntryUiActivator extends BaseModuleActivator {

	protected Log log = LogFactory.getLog(getClass());

    @Override
    public void started() {
        AdministrationService administrationService = Context.getAdministrationService();
        maybeSetGP(administrationService, OpenmrsConstants.GP_DRUG_ROUTES_CONCEPT_UUID, "162394AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
        maybeSetGP(administrationService, OpenmrsConstants.GP_DRUG_DOSING_UNITS_CONCEPT_UUID, "162384AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
        maybeSetGP(administrationService, OpenmrsConstants.GP_DRUG_DISPENSING_UNITS_CONCEPT_UUID, "162402AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
        maybeSetGP(administrationService, OpenmrsConstants.GP_DURATION_UNITS_CONCEPT_UUID, "1732AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
        ensureOrderFrequencies(Context.getOrderService(), Context.getConceptService(), "160855AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    }

    private void maybeSetGP(AdministrationService service, String prop, String val) {
        GlobalProperty gp = service.getGlobalPropertyObject(prop);
        if (gp == null) {
            service.saveGlobalProperty(new GlobalProperty(prop, val));
        } else if (StringUtils.isEmpty(gp.getPropertyValue())) {
            gp.setPropertyValue(val);
            service.saveGlobalProperty(gp);
        }
    }

    private void ensureOrderFrequencies(OrderService orderService, ConceptService conceptService, String uuid) {
        if (orderService.getOrderFrequencies(true).size() == 0) {
            Concept set = conceptService.getConceptByUuid(uuid);
            if (set != null) {
                for (ConceptAnswer conceptAnswer : set.getAnswers()) {
                    Concept concept = conceptAnswer.getAnswerConcept();
                    if (concept != null) {
                        OrderFrequency frequency = new OrderFrequency();
                        frequency.setConcept(concept);
                        orderService.saveOrderFrequency(frequency);
                    }
                }
            }
        }
    }

}
