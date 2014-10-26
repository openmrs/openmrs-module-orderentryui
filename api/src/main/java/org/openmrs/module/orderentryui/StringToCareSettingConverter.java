package org.openmrs.module.orderentryui;

import org.apache.commons.lang.StringUtils;
import org.openmrs.CareSetting;
import org.openmrs.api.OrderService;
import org.openmrs.ui.framework.converter.util.ConversionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class StringToCareSettingConverter implements Converter<String, CareSetting> {

    @Autowired
    @Qualifier("orderService")
    OrderService orderService;

    @Override
    public CareSetting convert(String id) {
        if (StringUtils.isBlank(id)) {
            return null;
        } else if (ConversionUtil.onlyDigits(id)) {
            return orderService.getCareSetting(Integer.valueOf(id));
        } else {
            return orderService.getCareSettingByUuid(id);
        }
    }

}
