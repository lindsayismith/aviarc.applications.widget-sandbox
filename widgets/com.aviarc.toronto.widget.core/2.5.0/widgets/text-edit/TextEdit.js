/*
global
YAHOO
parseBoolean
*/

(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    /* Get a local reference to some YAHOO areas */
    var lang = YAHOO.lang,
        dom  = YAHOO.util.Dom;

    var DataConvertorWrapper = function (textEdit) {
        this._textEdit = textEdit;
    };

    DataConvertorWrapper.prototype = {
        parseValue: function(value) {
            if (this._textEdit._isBound) {
                return this._textEdit._getCurrentFieldFormatter().parseValue(value);
            } else {
                return value;
            }
        },

        formatValue: function(value) {
            if (this._textEdit._isBound) {
                return this._textEdit._getCurrentFieldFormatter().formatValue(value);
            } else {
                return value;
            }
        },

        getInputMask: function() {
            if (this._textEdit._isBound) {
                return this._textEdit._getCurrentFieldFormatter().getInputMask();
            } else {
                return "";
            }
        }
    };

    /**
    * @module toronto.widget
    * @class TextEdit
    */
    Toronto.widget.core.v2_5_0.TextEdit = function () {
        // Internal value field
        this._innerValue = null;

        // Internal validation state;
        this._validState = true;
        this._readOnly = false;

        this._hasFocus = false;     // True if this field has the focus
        this._hasPrompt = false;    // True if this field has an active prompt-class
        this._isMultiLine = false;

        this.onValidChanged   = new Toronto.client.Event("TextEdit onValidChanged");
        this.onValueChanged   = new Toronto.client.Event("TextEdit onValueChanged");
        this.onKeyUp          = new Toronto.client.Event("TextEdit onKeyUp");
        this.onKeyDown        = new Toronto.client.Event("TextEdit onKeyDown");
        this.onKeyPress       = new Toronto.client.Event("TextEdit onKeyPress");
        this.onEnterKey       = new Toronto.client.Event("TextEdit onEnterKey");
        this.onEnabledChanged = new Toronto.client.Event("TextEdit onEnabledChanged");
        this.onFocus          = new Toronto.client.Event("TextEdit onFocus");
        this.onBlur           = new Toronto.client.Event("TextEdit onBlur");
    };

    lang.extend(Toronto.widget.core.v2_5_0.TextEdit, Toronto.framework.DefaultWidgetImpl, {

        startup: function (widgetContext) {
            Toronto.widget.core.v2_5_0.TextEdit.superclass.startup.apply(this, arguments);

            this._validHandler = null;
            this._readOnlyHandler = null;
            this._mandatoryHandler = null;

            this._doRealTimeValidation = parseBoolean(this.getAttribute('real-time-validation'));

            // Split dataset/field if we are bound
            var field = this.getAttribute('field');
            if (lang.isUndefined(field)) {
                this._isBound = false;
            } else {
                this._field = field.split(".");
                this._isBound = true;
            }

            this._isMultiLine = parseBoolean(this.getAttribute("multi-line"));
            this._dataType = this.getAttribute("datatype");

            this._input = this.getNamedElement("input");

            this.inputChangeEvent = widgetContext.createManagedEvent("TextEdit inputChangeEvent");
            this._input.onchange = this.inputChangeEvent.makeDOMEventFunction();
            this.inputChangeEvent.bindHandler(this._inputChanged, this, "TextEdit inputChangeEvent binding");

            widgetContext.addManagedDOMEvent(this._input, "onkeyup", this._keyUp, this, "TextEdit onkeyup binding");
            widgetContext.addManagedDOMEvent(this._input, "onkeydown", this._keyDown, this, "TextEdit onkeydown binding");
            widgetContext.addManagedDOMEvent(this._input, "onkeypress", this._keyPress, this, "TextEdit onkeypress binding");
            widgetContext.addManagedDOMEvent(this._input, "onfocus", this._focus, this, "TextEdit onfocus binding");
            widgetContext.addManagedDOMEvent(this._input, "onblur", this._blur, this, "TextEdit onblur binding");

            // Use the HTML 'length' attribute on the input element if a length is specified and the datatype does not do special formatting
            var length = this.getAttribute('length');
            if (!lang.isUndefined(length) && parseInt(length, 10) > 0) {
                if (this._dataType === undefined ||
                    this._dataType === "" ||
                    this._dataType === "user-defined" ||
                    this._dataType === "password-user-defined" ||
                    this._dataType === "alphanum" ||
                    this._dataType === "password") {
                    // Set the length attribute on the input element
                    if (!this._doRealTimeValidation) {
                        this._input.maxLength = length;
                    }
                    this._maxLength = length;
                }
            }

            this._attrEnabled = parseBoolean(this.getAttribute('enabled'));
            this._attrMandatory = parseBoolean(this.getAttribute('mandatory'));
            this._dsEnabled = true;

            this._readOnly = false;
            this._mandatory = false;
            this._dsMandatory = false;

            this._checkEnabled();

            if (this._attrEnabled && parseBoolean(this.getAttribute('focus'))) {
                this.focus();
            }

            this._ds = null;

            // Set up data convertor.  If we have a 'datatype' attribute, we use it.
            // Otherwise we try the field formatting system that comes from the data layer
            if (this._doesOverrideDatatype()) {
                this._dataConvertor = widgetContext.getSystem().getDataConvertorFactory().makeDataConvertor(this.getAttributes());
                if (this._dataConvertor.getInputMask) {
                    this._setInputMask(this._dataConvertor.getInputMask());
                }
            } else {
                // Depends on the field, retrieve it dynamically
                this._dataConvertor = new DataConvertorWrapper(this);
            }

            this.getWidgetContext().getSystem().onUnload.bindHandler(this._cleanup, this, "TextEdit onUnload cleanup handler");
        },

        _version: function () {
            return "2.5.0";
        },

        _cleanup: function () {
            this._input.onchange        = null;
            this._input.onkeyup         = null;
            this._input.onkeydown       = null;
            this._input.onkeypress      = null;
            this._input.onfocus         = null;
            this._input.onblur          = null;
            this._input                 = null;
        },

        _keyUp: function (e) {
            if (this._doRealTimeValidation) {
                this._checkValid();
            }

            this.onKeyUp.fireEvent({
                widget: this,
                keyCode: e.keyCode,
                altKey: e.altKey,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey
            });
        },

        _keyDown: function (e) {
            if (!this._isMultiLine && e.keyCode == 13) {
                this._inputChanged();
                this.onEnterKey.fireEvent({
                    widget: this,
                    keyCode: e.keyCode,
                    altKey: e.altKey,
                    ctrlKey: e.ctrlKey,
                    shiftKey: e.shiftKey
                });
            }
            this.onKeyDown.fireEvent({
                widget: this,
                keyCode: e.keyCode,
                altKey: e.altKey,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey
            });
        },

        _keyPress: function (e) {
            // Check if CAPSLOCK is enabled on password fields
            if (this._dataType === "password") {
              // Could use YAHOO.util.Event.getCharCode(e) rather than e.which
              if (((e.which >= 65 && e.which <= 90) && !e.shiftKey) ||
                  ((e.which >= 97 && e.which <= 122) && e.shiftKey)) {
                this.addClass("capslock");
                dom.removeClass(this.getNamedElement("capslock"), "display-none");
              } else {
                dom.addClass(this.getNamedElement("capslock"), "display-none");
                this.removeClass("capslock");
              }
            }
            this.onKeyPress.fireEvent({
                widget: this,
                keyCode: e.which,    // Technically charCode, but we'll use keyCode for consistency
                altKey: e.altKey,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey
            });
        },

        _doesOverrideDatatype: function() {
            return (this._dataType !== null && !lang.isUndefined(this._dataType));
        },

        getStyledElements: function () {
            return [
                this.getContainerElement()
            ];
        },

        bind: function (dataContext) {
            Toronto.widget.core.v2_5_0.TextEdit.superclass.bind.apply(this, arguments);

            if (this._ds !== null) {
                //this._ds.onDataChanged.removeHandler(this._dsChangeHandler);
                this._dsChangeHandler = null;
                this._ds = null;
            }

            if (this._isBound) {
                this._ds = dataContext.findDataset(this._field[0]);
                this._dsChangeHandler = this._ds.bindOnCurrentRowFieldChangedHandler(this._field[1], this.refresh, this,
                    "TextEdit currentRowFieldChanged [" + this._field[1] + "] handler");
                this._ds.onCurrentRowChanged.bindHandler(this.refresh, this, "TextEdit currentRowChanged handler");
                this._ds.onContentsReplaced.bindHandler(this.refresh, this, "TextEdit contentsReplaced handler");
                this._bindFieldEvents();
            }

            this._dsEnabled = true;
        },

        // First value change path - through the input field
        _inputChanged: function () {
            var valid = this._checkParseValid();
            if (valid.isValid){
                // If a dataset exists then update it's value
                if (this._isBound) {
                    this._dsChangeHandler.disable();
                    try {
                        var field = this._ds.getCurrentRow().getFieldObject(this._field[1]);
                        field.setFormattedValue(valid.parsedValue);
                        //rawValue = field.getValue();
                    } finally {

                        this._dsChangeHandler.enable();
                        
                        // Refresh if the value is different
                        // rules may have modified while the event was disabled 
                        var value = this._ds.getCurrentRowField(this._field[1]);                       
                        if (value == valid.parsedValue) {
                            this._setInputValue(this._dataConvertor.formatValue(valid.parsedValue), valid.parsedValue);                         
                        } else {
                            this.refresh();
                        }
                        
                    }
                } else {                
                    this._setInputValue(this._dataConvertor.formatValue(valid.parsedValue), valid.parsedValue);
                }                
            } else {
                this._setInputValue(this._input.value);
            }
            this._checkValid();
        },

        // Events required for prompt-text support
        _focus: function (e) {
            this._hasFocus = true;
            if (this._innerValue === null || this._innerValue === "") {
                // Clear any existing prompt text
                this._input.value = "";  // IE displays "null" if set to null
                if (this._hasPrompt) {
                  this._hasPrompt = false;
                  this.removeClass("prompt-text");
                }
            }
            this.removeClass("invalid");
            this.onFocus.fireEvent({
                widget: this,
                event: e
            });
        },
        _blur: function (e) {
            this._hasFocus = false;
            if ((this._input.value !== "" && !this._hasPrompt) ||
                (this._input.value === "" && this._innerValue !== null)) {
              /* Needed for IE - else newly entered values are lost
                 when the user clicks on an external window */
              this._inputChanged();
            } else {
              this._setInputValue(this._innerValue);
            }
            this._checkValid();
            this.onBlur.fireEvent({
                widget: this,
                event: e
            });
        },

        // Second value change path, dataset value changes
        refresh: function () {
            if (!this._isBound) {
                this._setInputValue(this._innerValue);
                return;
            }

            var row = this._ds.getCurrentRow();
            this._dsEnabled =  row !== null;

            if(! this._dsEnabled){
                this._setInputValue("", null);
            } else {
                // Input mask if applicable
                if (!this._doesOverrideDatatype()) {
                    this._setInputMask(this._dataConvertor.getInputMask());
                }

                var rawValue = this._ds.getCurrentRowField(this._field[1]);
                var valid = this._checkParseValid(rawValue);

                var field = row.getFieldObject(this._field[1]);
                this._readOnly = field.getMetadata().isReadOnly();
                this._dsMandatory = field.getMetadata().isMandatory();

                if (valid.isValid){
                    // The input value needs to be changed to be the formatted value
                    this._setInputValue(this._dataConvertor.formatValue(valid.parsedValue), valid.parsedValue);
                } else {
                    this._setInputValue(rawValue);
                }
                this._bindFieldEvents();
            }
            this._checkValid();

            this._checkMandatory();
            this._checkEnabled();
        },

        _bindFieldEvents : function(enable){
            var row = this._ds.getCurrentRow();

            if((enable || lang.isUndefined(enable)) && row !== null){
                // Unbind the old events
                if (this._validHandler !== null) {
                    this._bindFieldEvents(false);
                }

                var metadata = row.getFieldObject(this._field[1]).getMetadata();
                this._validHandler = metadata.onValidChanged.bindHandler(this._validChanged, this, "TextEdit onValidChange handler");
                this._readOnlyHandler = metadata.onReadOnlyChanged.bindHandler(this._readOnlyChanged, this, "TextEdit onReadOnlyChange handler");
                this._mandatoryHandler = metadata.onMandatoryChanged.bindHandler(this._mandatoryChanged, this, "TextEdit onMandatoryChange handler");

            } else if (this._validHandler !== null) {
                this._validHandler.unbind();
                this._readOnlyHandler.unbind();
                this._mandatoryHandler.unbind();

                this._validHandler = null;
                this._readOnlyHandler = null;
                this._mandatoryHandler = null;
            }
        },

        _setInputMask: function(mask) {
            if (mask) {
                var maskElem = this.getNamedElement("input-mask");
                if (maskElem) {
                    while (maskElem.firstChild) {
                        maskElem.removeChild(maskElem.firstChild);
                    }
                    maskElem.appendChild(document.createTextNode(mask));
                }
            }
        },

        /**
         * Set the value of the text-edit.
         * <p>
         * If supplied an invalid value, this method will throw an error, and the text-edit value will
         * not be changed.
         *
         * @param value {String} The value to set the text-edit to
         *
         * @throws {Toronto.core.validation.InvalidValueException} When the value is invalid.
         */
        setValue: function (value) {

            // If we're bound, but we don't have a current row, then throw an error.
            if (this._isBound && this._ds.getCurrentRowIndex() == -1) {
                throw new Error("Can't call setValue on text-edit when bound dataset has no current row.");
            }

            var valid = this._checkParseValid(value);

            if (valid.isValid) {
                this._setInputValue(this._dataConvertor.formatValue(valid.parsedValue), valid.parsedValue);

                if (this._isBound) {
                     this._dsChangeHandler.disable();
                     try {
                         this._ds.setCurrentRowField(this._field[1], valid.parsedValue);
                     } finally {
                         this._dsChangeHandler.enable();
                     }
                }
                this._checkValid();
            } else {
                if (valid.error !== null) {
                    throw valid.error;
                } else {
                    throw {getMessage :  function() { return valid.reason ;}};
                }
            }
        },

        /**
         * Retrieve this text-edit's current value.  Note that if the text-edit is currently invalid, then
         * the field to which is bound will not contain the same value as what appears in the text-edit.  This
         * method always returns the value in the text-edit, valid or not.
         * <p>
         * Note that this method may return null, in the case where the text-edit is unbound and has no value, or
         * when the text-edit is bound to a field that has no value.
         *
         * @return {String} The current value held by the text-edit.
         */
        getValue: function () {
            return this._innerValue;
        },

        _setInnerValue: function (newValue) {
            var finalValue = newValue;
            if (lang.isUndefined(newValue) || lang.isNull(newValue)) {
                finalValue = null;
            } else {
                // Coerce to string.  fixes bug 4687 where integer being returned was stored
                // as number, causing issues when trim() called later.
                finalValue = newValue + "";
            }
            if (finalValue !== this._innerValue) {
                var oldValue = this._innerValue;
                this._innerValue = finalValue;

                this.onValueChanged.fireEvent({
                    widget: this.getWidgetContext().getWidgetNode(),
                    oldValue: oldValue,
                    newValue: newValue
                });
            }
        },

        _setInputValue: function(value, innerValue){
            this.inputChangeEvent.disable();
            try {
                var newValue = value;
                if (lang.isUndefined(value) || lang.isNull(value)) {
                    newValue = ""; // keep IE happy
                }
                if (newValue === "" && !this._hasFocus) {
                    var prompt = this.getAttribute('prompt-text');
                    if (prompt) {
                        this.addClass("prompt-text");
                        this._input.value = prompt.replace(/\\n/g,"\n"); // Avoids the need for &#x0a;
                        this._hasPrompt = true;
                    } else {
                        this._input.value = newValue;
                    }
                } else {
                    if (this._hasPrompt) {this.removeClass("prompt-text"); this._hasPrompt=false;}
                    this._input.value = newValue;
                }
            } finally {
               this.inputChangeEvent.enable();
            }
            if (lang.isUndefined(innerValue)){
                this._setInnerValue(value);
            } else {
                this._setInnerValue(innerValue);
            }
        },

        _getCurrentFieldFormatter: function() {
            return this._ds.getCurrentRow().getFieldObject(this._field[1]).getMetadata().getFieldFormatter();
        },

        /**
         * Implements Validatable.validate
         */
        validate: function () {
            // The 'refresh' resolves Bug 5916 (where field has no value for users returning
            // to a screen where the field is not readily visible (eg located in a different tab)
            var value = this.getValue();
            if ((value === null || value === "") && this._isBound) {
              this.refresh();
              value = this.getValue();
            }

            var valid = this._checkValid(value);

            // check mandatory
            // We only check for mandatory ourselves (widget validation) if we
            // were set to be mandatory through the attribute.
            // If field is mandatory (from a rule), we assume that the rule will also
            // take care of validating that mandatory field
            if (valid.isValid) {
                if (this._attrMandatory && (value === null || value.trim() === "")) {
                    valid.isValid = false;
                    valid.reason = 'You must enter a value in this field';
                    this.addClass('invalid');
                }
            }

            if (!valid.isValid) {
                if (valid.dataset){
                    return this._ds.getCurrentRow().getFieldObject(this._field[1]).getMetadata().getValidationInfo();
                }

                return [new Toronto.core.WidgetValidationInfo(valid.reason,
                                                            this.getWidgetID())];
            }

            return valid.isValid;
        },

        /**
         * Put the browser focus on this input element.
         */
        focus: function () {
            this._input.focus();
        },

        /**
         * Set the enabled property of this text-edit.  This determines whether the text-edit will be enabledd
         * providing there is a current row in the dataset to which it is bound.
         * <p>
         * If the underlying dataset has no
         * current row, the text-edit will be disabled even if this method is called with true.  The value passed
         * to this method will determine whether the text-edit is enabled once the dataset has a row.
         *
         * @param enabled {Boolean} whether this text-edit should accept input if it has a valid dataset row to bind to.
         */
        setEnabled: function (enabled) {
            this._attrEnabled = parseBoolean(enabled);
            this._checkEnabled();
        },

        /**
         * Retrieve the current enabled state of this text-edit.  This takes into account both the enabled flag
         * and whether its bound dataset has a current row.
         *
         * @return {Boolean}  Whether this text-edit is currently enabled.
         */
        getEnabled: function () {
            return this._isShownEnabled();
        },

        /**
         * Event raised whenever the text-edit Enabled property changes.  This includes
         * both setting the enabled flag via setEnabled, and if the enabled status changes
         * because the bound dataset has no current row.
         *
         *  @event onEnabledChanged
         *  @param info {Object} The info object, which contains the following fields:
         *         widget: A reference to the widget that fired the event
         *         enabled: A boolean value that gives the new value of the enabled property.
         */
        onEnabledChanged: null,

        getMandatory: function() {
            return this._isMandatory();
        },

        setMandatory: function(mandatory) {
            this._attrMandatory = parseBoolean(mandatory);
            this._checkMandatory();
        },

        _isShownEnabled : function(){
            return this._attrEnabled && this._dsEnabled && !this._readOnly;
        },

        _checkEnabled: function(){
            var enabled = this._attrEnabled && this._dsEnabled && !this._readOnly;

            this[enabled ? 'removeClass' : 'addClass' ]('disabled');

            if (this._enabled !== enabled) {
                this._enabled = enabled;
                this._input.disabled = enabled ? "" : "true";
                this.onEnabledChanged.fireEvent({
                    enabled: enabled,
                    widget: this.getWidgetContext().getWidgetNode()
                });
            }
        },

        /**
         * Mandatory Event
         */
        _mandatoryChanged : function(args) {
            this._dsMandatory = args.newValue;
            this._checkMandatory();
        },

        _checkMandatory : function(){
            var mandatory = this._isMandatory();
            if (this._mandatory != mandatory) {
                if (mandatory) {
                    this.addClass("mandatory");
                    dom.removeClass(this.getNamedElement("mandatory"), "display-none");
                } else {
                    this.removeClass("mandatory");
                    dom.addClass(this.getNamedElement("mandatory"), "display-none");
                }
                this._mandatory = mandatory;
            }
        },

        _isMandatory : function(){
            return this._dsMandatory || this._attrMandatory;
        },

        /**
         * ReadOnly Events
         */
        _readOnlyChanged : function(args){
            this._readOnly = args.newValue;
            this._checkEnabled();
        },

        /**
         * Valid Events
         */
        _validChanged: function(args){
            this._checkValid();
        },

        _checkParseValid: function(rawValue){
            var value = rawValue;
            if (lang.isUndefined(rawValue)) {
                value = this._hasPrompt ? "" : this._input.value;
            }
            var valid = {isValid : true, reason : '', parsedValue : value, error:null, dataset:false};
            if (value === null || (this._isBound && this._ds.getCurrentRow() === null)){
                return valid;
            }
            try{
                // Should we support a Simple Expression calculator on some datatypes?
                if (value !== undefined) {
                    if ((this._dataType === "integer" || this._dataType === "number"  ||
                         this._dataType === "float"   || this._dataType === "decimal" ||
                         this._dataType === "currency"
                        ) && value.search(/^[\-0-9(\.].*[\-+\/%*]/) === 0 && value.search(/^[\-0-9+\/%*\.() ]+$/) === 0) {
                        // Should only get here if the string is an expression and then
                        // only if it is a simple expression consisting of only ()+-*/%.
                        var result = "nan";
                        if (Toronto.widget.core.v2_5_0.ExpressionParser) {
                            try {result = new Toronto.widget.core.v2_5_0.ExpressionParser().evaluate(value).toString();} catch (ex1) {}
                        } else {
                            //try {result = eval(value).toString();} catch (ex2) {}
                        }
                        // Ensure that the result is a pure number
                        if (result.search(/^-?[0-9]+(\.[0-9]+)?$/) === 0) {value = result;}
                    }
                }

                var parsedValue = this._dataConvertor.parseValue(value);

                if (!lang.isUndefined(this._maxLength)) {
                    //var currentLength = new String(parsedValue).length;
                    var currentLength = parsedValue.toString().length;
                    if (currentLength > this._maxLength) {
                        throw new Toronto.client.InvalidValueException([
                            "Input length (", currentLength, ") exceeds maximum field length (", this._maxLength, ")"
                        ].join(""), parsedValue);
                    }
                }
                valid.parsedValue = parsedValue;
            } catch (ex) {
                if (ex instanceof Toronto.client.InvalidValueException ||
                        ex instanceof Toronto.core.validation.InvalidValueException) {
                    valid.isValid = false;
                    valid.error = ex;
                } else {
                    valid.isValid = false;
                    valid.error =  ex;
                }
            }

            return valid;
        },

        _checkValid: function(rawValue) {
            var value = rawValue;
            if (lang.isUndefined(rawValue)) {
                value = this._hasPrompt ? "" : this._input.value;
            }

            var valid = this._checkParseValid(value);

            // check dataset valid
            if (this._isBound &&  this._ds.getCurrentRow() !== null) {
                var field = this._ds.getCurrentRow().getFieldObject(this._field[1]);
                if (!valid.isValid) {valid.reason = valid.error.getMessage();}

                var metadata = field.getMetadata();
                if (!metadata.isValid()) {
                    valid.isValid = false;
                    valid.reason = metadata.getInvalidReason().join("\n");
                    valid.dataset = true;
                }
            }

            // adjust style
            if (valid.isValid){
                var tooltip = this.getAttribute('tooltip');
                if (tooltip === undefined || tooltip === null) {tooltip="";}
                this.getContainerElement().title = tooltip;
                this.removeClass('invalid');
            } else {
                this.getContainerElement().title = valid.reason;
                this.addClass('invalid');
            }

            // valid status changed fired event
            if (valid.isValid != this._validState) {
                this.onValidChanged.fireEvent(valid.isValid);
                this._validState = valid.isValid;
            }

            return valid;
        }
    });

    lang.augmentProto(Toronto.widget.core.v2_5_0.TextEdit, Toronto.util.CssUtils);
})();

