/*global
YAHOO
parseBoolean
*/

(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;
    var D = YAHOO.util.Dom;
    var L = YAHOO.lang;

    Toronto.widget.core.v2_5_0.DatePicker = function () {
        this.onEnabledChanged   = new Toronto.client.Event("DatePicker 2.5.0 onEnabledChanged");
        this.onValueChanged     = new Toronto.client.Event("DatePicker 2.5.0 onValueChanged");
        this.onValidChanged     = new Toronto.client.Event("DatePicker 2.5.0 onValidChanged");

        this._innerValue        = null;
        this._lastError			= null;
        this._renderMe			= true;

        this._isValid           = true;
        this._validationMessage = null;

        this._validHandler		= null;
        this._readOnlyHandler	= null;
        this._mandatoryHandler	= null;

        this._target            = null; // Are we pointing at a target field (ie a text-edit)
    };

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.DatePicker, Toronto.framework.DefaultWidgetImpl, {

        startup: function (widgetContext) {
            Toronto.widget.core.v2_5_0.DatePicker.superclass.startup.apply(this, arguments);

            var field = this.getAttribute('field');
            this._field = field.split(".");

            this._dataConvertor = widgetContext.getSystem().getDataConvertorFactory().makeDataConvertor({
                datatype: "date"
            });

            this._disableDiv = this.getNamedElement("disable-div");
            this._calendarElement = this.getNamedElement("calendar");

            if (parseBoolean(this.getAttribute('popup'))) {
                this._renderMe = false;
                this._popupButton = this.getNamedElement("popup-button");
                var popupClickEvent = widgetContext.createManagedEvent();
                this._popupButton.onclick = popupClickEvent.makeDOMEventFunction();
                popupClickEvent.bindHandler(this.showCalendar, this);
            }

            // create the calendar (initially hidden in CSS)
            this._initialiseCalendar();

            var dateSelected = widgetContext.createManagedEvent();
            this._calendar.selectEvent.subscribe(function () {
                // arguments = ["select", [[[y,m,d], [y,m,d]...]], null]
                // Since we disable date range selection, will only ever have one date
                var date = arguments[1][0][0];
                dateSelected.fireEvent({
                    year: date[0],
                    month: date[1],
                    day: date[2]
                });
            });
            this._calendarDateSelectedHandler = dateSelected.bindHandler(this._dateSelected, this);

            var calendarHidden = widgetContext.createManagedEvent();
            this._calendar.hideEvent.subscribe(function () {
                calendarHidden.fireEvent({});
            });
            calendarHidden.bindHandler(this._calendarHidden, this);

            this._attrEnabled = parseBoolean(this.getAttribute('enabled'));
            this._attrMandatory = parseBoolean(this.getAttribute('mandatory'));

            this._dsEnabled = true;
            this._readOnly = false;

            this._mandatory = this._attrMandatory; // Current Mandatory status of the widget
            this._dsMandatory = false;

            this._valid = true; // Current Validity status of the widget
            this._attrValid = true; // If the widget has been setInvalid

            this._popup = parseBoolean(this.getAttribute('popup'));
            this.getWidgetContext().getSystem().onUnload.bindHandler(this._cleanup, this);
        },

        _cleanup: function () {
            this._popupButton       = null;
            this._disableDiv        = null;
            this._calendarElement   = null;
            this._calendar          = null;
        },

        _render: function () {
            if (this._renderMe) {this._calendar.render();}
        },

        _initialiseCalendar: function () {
            var config = {
                title: this.getAttribute('title'),
                close: parseBoolean(this.getAttribute('popup')),
                navigator: {
                    strings: {
                        month: "Month:",
                        year: "Year:",
                        submit: "OK",
                        cancel: "Cancel",
                        invalidYear: "Please enter a valid year"
                    },
                    monthFormat: YAHOO.widget.Calendar.LONG,
                    initialFocus: "year"
                }
            };

            this._calendar = new YAHOO.widget.Calendar(this._calendarElement, config);

            // Mess with this horrible configuration interface to ensure our dates are in yyyy-mm-dd format (default is mm/dd/yyyy)
            // TODO: integrate into screen L10n system, when we have one
            this._calendar.configLocale("DATE_FIELD_DELIMITER", ["-"]);
            this._calendar.configLocale("MDY_DAY_POSITION", [3]);
            this._calendar.configLocale("MDY_MONTH_POSITION", [2]);
            this._calendar.configLocale("MDY_YEAR_POSITION", [1]);

            // Must unset these or they will break parsing, due to our alternate value of DATE_FIELD_DELIMITER
            this._calendar.configLocale("DATE_DELIMITER", [null]);
            this._calendar.configLocale("DATE_RANGE_DELIMITER", [null]);

            // Probably easiest to just let the calendar parse these, since we've gone to the trouble of configuring it above
            if (!YAHOO.lang.isUndefined(this.getAttribute('max-date'))) {
                this._calendar.configMaxDate(null, [this.getAttribute('max-date')]);
            }
            if (!YAHOO.lang.isUndefined(this.getAttribute('min-date'))) {
                this._calendar.configMinDate(null, [this.getAttribute('min-date')]);
            }

            this._render();
        },

        /*
         *   This function finds the postion of the element and returns it's offset coordinates,
         *   as well as the total offset coordinates of all it's parent elements
         *     @param:  elementToLocate
         *     @return: x - position of the reference element on the horizontial axis
         *     @return: y - position of the reference element on the vertical axis
         */
        _findElementPosition : function (elementToLocate) {
            var x = 0;  // The Left location of the box
            var y = 0;  // The Top  location of the box

            // Total of the offset locations of the box and all its parent locations to arrive with the actual screen location of the box.
            if (elementToLocate.offsetParent) {
                do {
                    x += elementToLocate.offsetLeft;
                    y += elementToLocate.offsetTop;
                } while (elementToLocate = elementToLocate.offsetParent);
            }
            return {"x" : x, "y" : y};
        },

        _evaluatePosition: function(elementToPosition, referenceElement) {
            var position, referenceElementDimensions;

            var elementToMoveDimensions = {
                "width"  : elementToPosition.clientWidth  + elementToPosition.style.padding,
                "height" : elementToPosition.clientHeight + elementToPosition.style.padding
            };

            if (referenceElement.clientX) {
                // Use the coordinates as the location
                referenceElementDimensions = {
                    "width"  : 0,
                    "height" : 0
                };
                position = {
                  "x": referenceElement.clientX +
                    (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft),
                  "y": referenceElement.clientY +
                    (document.documentElement.scrollTop  ? document.documentElement.scrollTop  : document.body.scrollTop)
                };
            } else {
                referenceElementDimensions = {
                    "width"  : referenceElement.clientWidth  + referenceElement.style.padding,
                    "height" : referenceElement.clientHeight + referenceElement.style.padding
                };
                position = this._findElementPosition(referenceElement);
            }

            var screenWidth  = YAHOO.util.Dom.getClientWidth(document.body);
            var screenHeight = YAHOO.util.Dom.getClientHeight(document.body);

            var x = position.x;
            var tmp = x + parseInt(elementToMoveDimensions.width,10) + 10 - screenWidth;
            if (tmp > 0) {x -= tmp;}

            var y = position.y + parseInt(referenceElementDimensions.height,10);
            tmp = y + parseInt(elementToMoveDimensions.height,10) + 10 - screenHeight;
            if (tmp > 0) {y -= tmp;}

            return { "x" : x, "y" : y};
        },

        showCalendar: function (referenceElement) {
            if (typeof referenceElement === "string") {
                this._target = this._widgetContext.findWidget(referenceElement);
                // Let's try and retrieve the value of the referenceElement to use
                // as our starting point in the calendar.
                try {this.setValue(this._target.getValue());} catch(e) {}
                referenceElement = this._target.getContainerElement();
            } else {
                // We'll true and use the position of the mouse here, rather than the button
                if (!referenceElement.clientX) {
                    referenceElement = this._popupButton;
                }
            }
            this._renderMe = true;
            this._calendar.render();
            this._calendar.show();

            YAHOO.util.Event.addListener(document, "mousedown", this._hideCalendar, this, true);

            document.body.appendChild(this._calendarElement);

            // Must remove the display-none else we do not get a width/height
            YAHOO.util.Dom.removeClass(this._calendarElement, "display-none");

            // Calculate a position for this element
            var coords = this._evaluatePosition(this._calendarElement, referenceElement);
            this._calendarElement.style.left = coords.x + "px";
            this._calendarElement.style.top  = coords.y + "px";

        },

        _hideCalendar : function(e) {
            if (!this._calendar) {
                return;
            }

            var target = YAHOO.util.Event.getTarget(e);
            if (target.tagName === "SELECT" && YAHOO.util.Dom.isAncestor(this._calendarElement, target)) {
                return;
            } else if (this._calendarElement === target || YAHOO.util.Dom.isAncestor(this._calendarElement, target)) {
                YAHOO.util.Event.preventDefault(e);
            } else {
                this._calendar.hide();
                this.getContainerElement().insertBefore(this._calendarElement, this._disableDiv);
                YAHOO.util.Event.removeListener(document, "mousedown", this._hideCalendar);
            }
        },

        _calendarHidden: function () {
            // Only can reach this code if the calendar is closable, which if popup="n", it will not be
            //YAHOO.util.Dom.removeClass(this._popupButton, "display-none");
        },

        _dateSelected: function (date) {

            this._dsFieldChangedHandler.disable();
            var newDate = this.formatDate(date.year, date.month, date.day);
            var oldDate = this._ds.getCurrentRowField(this._field[1]);
            if (newDate === oldDate) {    // De-selection
                this._setInnerValue(null);
                this._ds.setCurrentRowField(this._field[1], null);
                this._clearDate();
            } else {
                this._setInnerValue(newDate);
                this._ds.setCurrentRowField(this._field[1], newDate);

                this._checkValid(true);
                if (this._target) {
                    try {this._target.setValue(newDate);} catch(e) {}
                    this._target = null;
                }
            }
            if (parseBoolean(this.getAttribute('popup'))) {
                this._calendar.hide();
            }
            this._dsFieldChangedHandler.enable();
        },

        _jumpToMonth: function (month, year) {
            this._calendar.setMonth(month);
            this._calendar.setYear(year);
            this._render();
        },

        formatDate: function (year, month, day) {
            var pad = function (val, length) {
                val = "" + val;
                while (val.length < length) {
                    val = "0" + val;
                }
                return val;
            };
            return [
                pad(year, 4),
                pad(month, 2),
                pad(day, 2)
            ].join('-');
        },

        bind: function (dataContext) {
            Toronto.widget.core.v2_5_0.DatePicker.superclass.bind.apply(this, arguments);

            this._ds = dataContext.findDataset(this._field[0]);
            this._ds.onCurrentRowChanged.bindHandler(this._currentRowChanged, this);
            this._dsFieldChangedHandler = this._ds.bindOnCurrentRowFieldChangedHandler(this._field[1], this.refresh, this);
            this._ds.onContentsReplaced.bindHandler(this._currentRowChanged, this);

            this._dsEnabled = !YAHOO.lang.isNull(this._ds.getCurrentRow());
            this._enabled = this._attrEnabled && this._dsEnabled;
        },

        _bindFieldEvents: function(enable){
            var row = null;
            if (this._dsEnabled){
                row = this._ds.getCurrentRow();
            }

            if((enable || YAHOO.lang.isUndefined(enable)) && row !== null){

                // Unbind the old events
                if(this._validHandler !== null){
                    this._bindFieldEvents(false);
                }

                var metadata = row.getFieldObject(this._field[1]).getMetadata();
                this._validHandler = metadata.onValidChanged.bindHandler(this._validChanged, this, 'DatePicker');
                this._readOnlyHandler = metadata.onReadOnlyChanged.bindHandler(this._readOnlyChanged, this, 'DatePicker');
                this._mandatoryHandler = metadata.onMandatoryChanged.bindHandler(this._mandatoryChanged, this, 'DatePicker');


                this._mandatoryChanged({oldValue:false, newValue:metadata.isMandatory()});
                this._readOnlyChanged({oldValue:false, newValue:metadata.isReadOnly()});
                this._checkValid();


            }else if(this._validHandler !== null){
                this._validHandler.unbind();
                this._readOnlyHandler.unbind();
                this._mandatoryHandler.unbind();

                this._validHandler = null;
                this._readOnlyHandler = null;
                this._mandatoryHandler = null;
            }
        },

        _clearDate: function () {
            this._calendarDateSelectedHandler.disable();
            var selected = this._calendar.getSelectedDates();

            if (!YAHOO.lang.isUndefined(selected[0])) {
                this._calendar.clear();
                this._jumpToMonth(selected[0].getMonth(), selected[0].getFullYear());
            }
            this._calendarDateSelectedHandler.enable();
        },

        // Set the date displayed in the calendar from a 'yyyy-mm-dd' string
        _setInnerCalendarDate: function (date) {
            this._calendarDateSelectedHandler.disable();

            // Out of bound dates can't be shown, but we can go to the right year/month
            var dateObj = this._toDate(date);
            if (this._calendar.isDateOOB(dateObj)) {
                this._jumpToMonth(dateObj.getMonth(), dateObj.getFullYear());
            } else {
                var selected = this._calendar.select(date);
                this._jumpToMonth(selected[0].getMonth(), selected[0].getFullYear());
            }
            this._calendarDateSelectedHandler.enable();
        },

        _currentRowChanged: function(){
            this._bindFieldEvents();
            this.refresh();
        },

        refresh: function () {

            // Firstly, do we have a current row?
            if (YAHOO.lang.isNull(this._ds.getCurrentRow())) {
                this._clearDate();
                this._setInnerValue(null);
                this._checkValid(true);

                this._setDsEnabled(false);
            } else {
                var field = this._ds.getCurrentRow().getFieldObject(this._field[1]);
                var value = this._ds.getCurrentRowField(this._field[1]);

                var valid = null;
                var validationMessage = undefined;

                // Is it valid?  innerValue is set regardless
                if (value === null || value.trim() === "") {
                    this._clearDate();
                    valid = true;
                } else {
                    if (this._isDate(value)) {
                        // It could be out of range
                        if (this._calendar.isDateOOB(this._toDate(value))) {
                            valid = false; validationMessage = "Selected date '" + value + "' is outside the permitted range";
                        } else {
                            valid = true;
                        }
                        // set the calendar date - even if its out of bounds
                        this._setInnerCalendarDate(value);
                    } else {
                        // show nothing, and we're invalid
                        this._clearDate();
                        valid = false; validationMessage = "Bound value '" + value + "' is not a valid date";
                    }
                }
                this._dsMandatory = field.getMetadata().isMandatory();
                this._readOnly = field.getMetadata().isReadOnly();

                // These calls may result in events firing, order is important.
                // I've made it value changed first, then enabled changed, then valid changed, as the latter two may want the new value
                this._setInnerValue(value);
                this._setDsEnabled(true);
                if (valid === null) { throw new Error("Internal error: valid flag not set"); }

                this._lastError = validationMessage;
                this._checkMandatory();
                this._checkValid(valid);

            }
        },


        _setInnerValue: function(value) {
            if (value != this._innerValue) {
                var priorValue = this._innerValue;
                this._innerValue = value;
                this.onValueChanged.fireEvent({
                    widget: this.getWidgetContext().getWidgetNode(),
                    oldValue: priorValue,
                    newValue: value
                });
            }
        },

        getStyledElements: function () {
            return [
                this.getContainerElement()
            ];
        },

        setMinDate: function (value) {
            this._calendar.configMinDate(null, [value]);
            this._render();
        },

        setMaxDate: function (value) {
            this._calendar.configMaxDate(null, [value]);
            this._render();
        },


        /***
         * Valid Change
         */
        _validChanged : function(args){

            this._checkValid();


        },
        _checkValid: function(attrValid){

            var valid = {isValid : true, dataset:false};
            // Check to see if the dataset is valid
            if(this._dsEnabled){
                var row = this._ds.getCurrentRow();
                if (row !== null){
                    var metadata = this._ds.getCurrentRow().getFieldObject(this._field[1]).getMetadata();
                    if(!metadata.isValid()){
                        valid.isValid  = false;
                        this._lastError = metadata.getInvalidReason().join("\n");
                        valid.dataset = true;
                    }
                }
            }

            if (!YAHOO.lang.isUndefined(attrValid)){
                this._attrValid = attrValid;
            }
            if (valid.isValid){
                 valid.isValid = this._attrValid;
            }

            if (valid.isValid != this._valid) {
                this._valid = valid.isValid;
                if (this._valid) {
                    this.removeClass("invalid");
                } else {
                    this.addClass("invalid");
                }
                this.onValidChanged.fireEvent(this._valid);
            }

            return valid;
        },

/*
        _setValid: function(valid, message) {
            if (!valid && YAHOO.lang.isUndefined(message)) {
                throw new Error("Internal error, no validation message provided");
            }
            this._validationMessage = message;

            if (valid != this._isValid) {
                this._isValid = valid;
                if (valid) {
                    this.removeClass("invalid");
                } else {
                    this.addClass("invalid");
                }
                this.onValidChanged.fireEvent(valid);
            }
        },
*/
        /**
         * Retrieve the current value of the date picker.  Returns null if no date is selected.
         */
        getValue: function () {
            return this._innerValue;
        },

        setValue: function(value) {

            // do we have a current row?
            if (YAHOO.lang.isNull(this._ds.getCurrentRow())) {
                throw new Error("DatePicker::setValue : Bound dataset has no current row");
            } else {
                // Is it valid?  innerValue is set regardless
                if (value === null) {
                    this._clearDate();
                } else {
                    if (this._isDate(value)) {
                        // Could be out of bounds
                        if (this._calendar.isDateOOB(this._toDate(value))) {
                            throw new Error("DatePicker::setValue : date is outside the permitted range");
                        }
                        // set the calendar date
                        this._setInnerCalendarDate(value);
                    } else {
                        // we throw an error, don't set anything
                        throw new Error("DatePicker:setValue : Value '" + value + "' is not a valid date");
                    }
                }

                // These calls may result in events firing, order is important.
                // I've made it value changed first, then enabled changed, then valid changed, as the latter may want the value
                this._setInnerValue(value);

                // set the dataset field
                this._dsFieldChangedHandler.disable();
                try {
                    this._ds.setCurrentRowField(this._field[1], value);
                } finally {
                    this._dsFieldChangedHandler.enable();
                }


                this._checkValid(true);
            }
        },

        _isDate: function (dateStr) {
            var date = this._calendar._parseDate(dateStr);
            // Invalid date will return something like [NaN, NaN, NaN]
            return YAHOO.lang.isNumber(date[0]) && YAHOO.lang.isNumber(date[1]) && YAHOO.lang.isNumber(date[2]);
        },

        _toDate: function (dateStr) {
            // TODO: find a nice way to do this without resorting to private methods on the calendar object
            return this._calendar.toDate(this._calendar._parseDate(dateStr));
        },

        validate: function () {
            if (this._ds.getCurrentRowIndex() === -1) {
                return true;
            }
            var valid = this._checkValid();

            if (!valid.isValid) {
                if(valid.dataset){
                    return this._ds.getCurrentRow().getFieldObject(this._field[1]).getMetadata().getValidationInfo();
                }

                return [new Toronto.core.WidgetValidationInfo(this._lastError, this.getWidgetID())];

            }

            if ( this.getMandatory() &&
              ((this._innerValue === null) || (this._innerValue.trim() === ""))) {
                return [new Toronto.core.WidgetValidationInfo("You must select a date", this.getWidgetID())];

            }

            return true;
        },

        /**
         * Mandatory Changes
         */
        getMandatory: function() {
            return this._attrMandatory || this._dsMandatory;
        },

        setMandatory: function(mandatory) {
            this._attrMandatory = parseBoolean(mandatory);
            this._checkMandatory();
        },

        _mandatoryChanged: function(args){
            this._dsMandatory = args.newValue;
            this._checkMandatory();
        },

        _checkMandatory: function(){
            var mandatory = this.getMandatory();

            if (mandatory !== this._mandatory) {
                if (mandatory) {
                    this.addClass("mandatory");
                    D.removeClass(this.getNamedElement("mandatory"), "display-none");
                } else {
                    this.removeClass("mandatory");
                    D.addClass(this.getNamedElement("mandatory"), "display-none");
                }
                this._mandatory = mandatory;
                // DatePicker doesnt have a mandatory Changed event?
                // this.onMandatoryChanged.fireEvent({ widget: this.getWidgetContext().getWidgetNode(),
                //                                    mandatory: this._mandatory });
            }
        },

        /**
         * Enabled/ReadOnly
         */
        _readOnlyChanged: function(args){
            this._readOnly = args.newValue;
            this._checkEnabled();
        },

        _checkEnabled: function(){
            var enabled = this.getEnabled();
            YAHOO.util.Dom[enabled ? "addClass" : "removeClass"](this._disableDiv, "display-none");

            if (!enabled && this._popup) {
                this._calendar.hide();
            }

            if (this._enabled !== enabled) {
                this._enabled = enabled;

                this.onEnabledChanged.fireEvent({
                    enabled: enabled,
                    widget: this.getWidgetContext().getWidgetNode()
                });
            }
        },

        getEnabled: function () {
            return this._attrEnabled && this._dsEnabled && !this._readOnly;
        },

        setEnabled: function (enabled) {
            this._attrEnabled = parseBoolean(enabled);
            this._checkEnabled();

            var prior = this.getEnabled();
            this._attrEnabled = parseBoolean(enabled);
            if (prior != this.getEnabled()) {
                this._enabledChanged();
            }
        },
        _enabledChanged: function () {
            var enabled = this.getEnabled();

            YAHOO.util.Dom[enabled ? "addClass" : "removeClass"](this._disableDiv, "display-none");
            this.onEnabledChanged.fireEvent({
                widget: this.getWidgetContext().getWidgetNode(),
                enabled: enabled
            });
        },

        _setDsEnabled: function(enabled) {
            var prior = this.getEnabled();
            this._dsEnabled = parseBoolean(enabled);
            if (prior != this.getEnabled()) {
                this._enabledChanged();
            }
        }
    });

    YAHOO.lang.augmentProto(Toronto.widget.core.v2_5_0.DatePicker, Toronto.client.ClassListImplementor);
})();

