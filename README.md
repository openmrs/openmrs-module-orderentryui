<img src="https://talk.openmrs.org/uploads/default/original/2X/f/f1ec579b0398cb04c80a54c56da219b2440fe249.jpg" alt="OpenMRS"/>

# OPENMRS ORDER ENTRY UI
#### Table of Contents

1. [Overview](#overview)
   1. [What This Module Does Do](#What-This-Module-Does-Do)
   2. [What This Module Does Not Do](#WhatThis-Module-Does-Not-Do)
2. [Download](#Download)
3. [Video Tutorial](#Video-Tutorial)
4. [Resources](#Resources)
5. [Team Lead](#Team-Lead)
6. [Developers](#Developers)
7. [Issues](#issues)
8. [Community](#community)
9. [Support](#support)
10. [License](#license)

 # Overview
 > The OpenMRS Order Entry UI is an application to support creating of orders(Drug and Lab) through the user interface.

* This module is an Open Web App that has all of its resources (HTML, CSS, JavaScript, app manifest, and so on) contained in a zip file. It consumes the OpenMRS REST API.

* Data entry can be done using any modern browser that supports JavaScript. The browser which has been tested most frequently with this module is Google Chrome and hence it's the recommended browser.

# What This Module Does Do
1.Allows data entry to be done directly from any modern JavaScript enabled browser.
2.Shows details of the patient whose orders is being accessed.
3.Displays pagination when a patient has orders that go beyond the first page.
##### Draft
* Allows a user to add multiple orders of different types to a single draft.
* Allows a user to edit a drug order in the draft order before saving it.
* Allows a user to toggle the urgency of a lab order before saving it.
* Allows a user to discard an order from the draft.
* Allows a user to save multiple orders to the database from the draft.
##### Drug Orders
* Supports adding drug orders for patients using either the Standard Dosage or Free Text tabs.
* Allows a user to edit an active drug order.
* Allows a user to discontinue an active drug order.
* Automatically discontinues an active drug order when the duration specified for the drug order is reached.
* Shows full details of a drug order including the date activated, date stopped or auto-expired, drug order description, dose, units, frequency etc.
##### Lab Orders
* Supports adding of lab orders for patients.
* Allow a user to toggle the urgency of a lab order.
* Allows a user to view all the lab orders ordered for a patient
# What This Module Does Not Do
* Currently, only Drug and Lab orders are supported.
* Does not support re-activating a discontinued drug order.
  
# Download
> To view or download the OpenMRS Order Entry UI Module, please go to the module repository here:

* To download module: https://addons.openmrs.org/#/show/org.openmrs.owa.orderentryui 
* To view or download source code:  https://github.com/openmrs/openmrs-owa-orderentry
# Video Tutorial
A video tutorial walkthrough of the Order UI can be watched here : https://www.youtube.com/watch?v=7lhLOwZLqzo

# Resources
* [Order Entry UI End User Guide](https://wiki.openmrs.org/display/projects/Order+Entry+UI+End+User+Guide)
* [Order Entry UI Administrator Guide](https://wiki.openmrs.org/display/projects/Order+Entry+UI+Administrator+Guide)
* [GitHub project (source code)](https://github.com/openmrs/openmrs-owa-orderentry)
* Order Entry UI Release Note
* [Sprint 1](https://wiki.openmrs.org/display/projects/Order+Entry+UI+Sprint+1)
* [Sprint 2](https://wiki.openmrs.org/display/projects/Order+Entry+UI+Sprint+2)
* [Sprint 3](https://wiki.openmrs.org/display/projects/Order+Entry+UI+Sprint+3)
* [Sprint 4](https://wiki.openmrs.org/display/projects/Order+Entry+UI+Sprint+4)
* [Sprint 5](https://wiki.openmrs.org/display/projects/Order+Entry+UI+Sprint+5)
* [Sprint 6](https://wiki.openmrs.org/display/projects/Order+Entry+UI+Sprint+6)
* [Sprint 7](https://wiki.openmrs.org/display/projects/Order+Entry+UI+Sprint+7)
* [Sprint 8](https://wiki.openmrs.org/display/projects/Order+Entry+UI+Sprint+8)
* [Sprint 9](https://wiki.openmrs.org/display/projects/Order+Entry+UI+Sprint+9)
* [Sprint 10](https://wiki.openmrs.org/display/projects/Order+Entry+UI+Sprint+10)

# Team Lead

[Daniel Kayiwa](https://wiki.openmrs.org/display/~dkayiwa)

# Developers
* [Flavia Nshemerirwe](https://wiki.openmrs.org/display/~flavia)
* [Fredrick Mgbeoma](https://wiki.openmrs.org/display/~fred)
* [Geoffrey Asiimwe](https://wiki.openmrs.org/display/~geofrocker)
* [Osaze Edo-Osagie](https://wiki.openmrs.org/display/~zeze)
* [Betty Kebenei](https://wiki.openmrs.org/display/~betty)
* [Lanre Lawal](https://wiki.openmrs.org/display/~larrystone)
* [Gabriel Micah](https://wiki.openmrs.org/display/~topseysuave)
* [Efosa okpugie](https://wiki.openmrs.org/display/~efosa)
* [Tunmise ogunniyi](https://wiki.openmrs.org/display/~tunmi)
* [Isaiah Rotimi Yemitan](https://wiki.openmrs.org/display/~rotimi)
* [Daramola Ajiboye](https://wiki.openmrs.org/display/~daramola98)
* [Korir Desmond](https://wiki.openmrs.org/display/~desmond)
* [Titus Kipkemboi](https://wiki.openmrs.org/display/~tittoh)

## Issues

If you want help fix existing issues or you found a bug and want to tell us please go to

https://issues.openmrs.org

## Community

[![OpenMRS Talk](https://omrs-shields.psbrandt.io/custom/openmrs/talk/F26522?logo=openmrs)](http://talk.openmrs.org)
[![OpenMRS IRC](https://img.shields.io/badge/openmrs-irc-EEA616.svg?)](http://irc.openmrs.org)
[![OpenMRS Telegram](https://img.shields.io/badge/openmrs-telegram-009384.svg?)](https://telegram.me/openmrs)
[![OpenMRS Wiki](https://img.shields.io/badge/openmrs-wiki-5B57A6.svg?)](https://wiki.openmrs.org)

## Support

Talk to us on [OpenMRS Talk](https://talk.openmrs.org/)

## License

[MPL 2.0 w/ HD](http://openmrs.org/license/) © [OpenMRS Inc.](http://www.openmrs.org/)

