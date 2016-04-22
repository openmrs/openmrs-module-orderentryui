package org.openmrs.module.orderentryui.page.controller;

import org.openmrs.CareSetting;
import org.openmrs.Concept;
import org.openmrs.EncounterType;
import org.openmrs.Order;
import org.openmrs.Patient;
import org.openmrs.Visit;
import org.openmrs.api.EncounterService;
import org.openmrs.api.OrderService;
import org.openmrs.api.VisitService;
import org.openmrs.module.appui.UiSessionContext;
import org.openmrs.module.webservices.rest.web.ConversionUtil;
import org.openmrs.module.webservices.rest.web.representation.NamedRepresentation;
import org.openmrs.module.webservices.rest.web.representation.Representation;
import org.openmrs.ui.framework.UiUtils;
import org.openmrs.ui.framework.annotation.SpringBean;
import org.openmrs.ui.framework.page.PageModel;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;


public class DrugOrdersPageController {

	public void get(@RequestParam("patient") Patient patient,
			@RequestParam(value="visit", required=false) Visit visit,
			@RequestParam(value = "careSetting", required = false) CareSetting careSetting,
			@RequestParam(value="order", required=false) Order order,
			@SpringBean("encounterService") EncounterService encounterService,
			@SpringBean("visitService") VisitService visitService,
			@SpringBean("orderService") OrderService orderService,
			UiSessionContext sessionContext,
			UiUtils ui,
			PageModel model) {

		// HACK
		EncounterType drugOrderEncounterType = encounterService.getAllEncounterTypes(false).get(0);

		List<CareSetting> careSettings = orderService.getCareSettings(false);

		List<Concept> dosingUnits = orderService.getDrugDosingUnits();
		List<Concept> dispensingUnits = orderService.getDrugDispensingUnits();
		Set<Concept> quantityUnits = new LinkedHashSet<Concept>();
		quantityUnits.addAll(dosingUnits);
		quantityUnits.addAll(dispensingUnits);

		Map<String, Object> jsonConfig = new LinkedHashMap<String, Object>();
		jsonConfig.put("patient", convertToFull(patient));
		jsonConfig.put("provider", convertToFull(sessionContext.getCurrentProvider()));
		jsonConfig.put("drugOrderEncounterType", convertToFull(drugOrderEncounterType));
		jsonConfig.put("careSettings", convertToFull(careSettings));
		jsonConfig.put("routes", convertToFull(orderService.getDrugRoutes()));
		jsonConfig.put("doseUnits", convertToFull(dosingUnits));
		jsonConfig.put("durationUnits", convertToFull(orderService.getDurationUnits()));
		jsonConfig.put("quantityUnits", convertToFull(dispensingUnits)); // after TRUNK-4524 is fixed, change this to quantityUnits
		jsonConfig.put("frequencies", convertTo(orderService.getOrderFrequencies(false), new NamedRepresentation("fullconcept")));
		if (careSetting != null) {
			jsonConfig.put("intialCareSetting", careSetting.getUuid());
		}

		// if Visit is provided in the URL put it in the model
		if (visit != null ) {
			jsonConfig.put("visit", convertToFull(visit));
		}

		// if Visit is provided in the URL put it in the model
		if (order != null ) {
			jsonConfig.put("currentOrder", convertToFull(order));
		}


		model.put("patient", patient);
		model.put("jsonConfig", ui.toJson(jsonConfig));
	}

	private Object convertTo(Object object, Representation rep) {
		return object == null ? null : ConversionUtil.convertToRepresentation(object, rep);
	}

	private Object convertToFull(Object object) {
		return object == null ? null : ConversionUtil.convertToRepresentation(object, Representation.FULL);
	}

}
