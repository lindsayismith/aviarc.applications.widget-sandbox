/*global
 YAHOO
 */
(function(){

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    /**
     * @module toronto.widget
     * @class CheckBox
     */
    Toronto.widget.core.v2_5_0.CheckBox = function(){
        /**
         * Event fired when the checked value of the widget changes
         *
         * @event onCheckedChanged
         * @param info {Object} Info object
         */
        this.onCheckedChanged = new Toronto.client.Event("CheckBox onCheckedChanged");

        /**
         * Event fired when the checked value of the widget changes
         *
         * @event onValidChanged
         * @param info {Object} Info object
         */
        this.onValidChanged = new Toronto.client.Event("CheckBox onValidChanged");

        /**
         * Event fired when the checked value of the widget changes
         *
         * @event onEnabledChanged
         * @param info {Object} Info object
         */
        this.onEnabledChanged = new Toronto.client.Event("CheckBox onEnabledChanged");
    };

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.CheckBox, Toronto.framework.DefaultWidgetImpl, {

        /**
         * Implements Widget.startup.
         *
         * Retrieves references to this widget's DOM elements and attached DOM events.
         *
         * @method startup
         * @param widgetContext {WidgetContext}
         */
        startup: function(widgetContext){
            Toronto.widget.core.v2_5_0.CheckBox.superclass.startup.apply(this, arguments);

            this._selectionField = this.getAttribute('selection-field').split('.');
            this._inputElement = this.getNamedElement("input");

            // Use onclick here not onchange as IE doesn't respond to onchange until onblur has fired
            var inputChangeEvent        = widgetContext.createManagedEvent();
            this._onClickChange         = inputChangeEvent.makeDOMEventFunction();
            this._inputElement.onclick  = this._onClickChange;
            this._inputChangeBinding    = inputChangeEvent.bindHandler(this._onInputChange, this);

            this._attrEnabled = parseBoolean(this.getAttribute('enabled'));
            this._attrMandatory = parseBoolean(this.getAttribute('mandatory'));
            this._dsEnabled = true;
            this._dsMandatory = false;
            this._enabled = this._attrEnabled && this._dsEnabled;

            // Attach to the onActivate / onDeactivate events for default browser event disabling in Live Edit
            var widgetNode = widgetContext.getWidgetNode();
            if (widgetNode.onDeactivate instanceof Toronto.client.Event) {
                widgetNode.onDeactivate.bindHandler(this._deactivate, this);
            }

            if (widgetNode.onActivate instanceof Toronto.client.Event) {
                widgetNode.onActivate.bindHandler(this._activate, this);
            }

            this.getWidgetContext().getSystem().onUnload.bindHandler(this._cleanup, this);

            this._readOnly = false;
            this._dsMandatory = false;
            this._valid = true;

			this._validHandler = null;
			this._readOnlyHandler = null;
			this._mandatoryHandler = null;
        },

        /**
         * Implements Widget.bind
         *
         * Sets reference to required dataset and binds to data change event.
         *
         * @method bind
         * @param {DataContext} dataContext The data context to bind to
         */
        bind: function(dataContext){
            Toronto.widget.core.v2_5_0.CheckBox.superclass.bind.apply(this, arguments);

            this._ds = dataContext.findDataset(this._selectionField[0]);
            this._dataChangeBinding = this._ds.bindOnCurrentRowFieldChangedHandler(this._selectionField[1], this._onDataChanged, this);
            this._ds.onCurrentRowChanged.bindHandler(this._onDataChanged, this);
            this._ds.onContentsReplaced.bindHandler(this._onDataChanged, this);

            this._bindFieldEvents();

            this._dsEnabled = this._ds.getCurrentRow() !== null;
            this._enabled =this._attrEnabled && this._dsEnabled && !this._readOnly;
        },


        _cleanup: function () {
            this._inputElement = null;
        },

        /**
         * Bind to the current field metadata, listening to the readOnly/valid/mandatory changes
         */
        _bindFieldEvents : function(enable){
			var row = this._ds.getCurrentRow();

            if((enable || YAHOO.lang.isUndefined(enable)) &&
				row !== null){

                if (this._validHandler !== null){
                    this._bindFieldEvents(false);
                }

                var metadata = row.getFieldObject(this._selectionField[1]).getMetadata();
                this._validHandler = metadata.onValidChanged.bindHandler(this._validChanged, this);
                this._readOnlyHandler = metadata.onReadOnlyChanged.bindHandler(this._readOnlyChanged, this);
                this._mandatoryHandler = metadata.onMandatoryChanged.bindHandler(this._mandatoryChanged, this);
            }else if(this._validHandler !== null){
                this._validHandler.unbind();
                this._readOnlyHandler.unbind();
                this._mandatoryHandler.unbind();

                this._validHandler = null;
                this._readOnlyHandler = null;
                this._mandatoryHandler = null;
            }
        },

        /**
         * Implements Widget.refresh
         *
         * Updates the checkbox element to match the bound field.
         *
         * @method refresh
         */
        refresh: function(){
            this._dsEnabled = this._ds.getCurrentRow() !== null;
            var checked = false;

            if (this._dsEnabled) {

                this._bindFieldEvents();
                var field = this._ds.getCurrentRow().getFieldObject(this._selectionField[1]);
                var fieldValue = field.getValue();

                this._readOnly = field.getMetadata().isReadOnly();
                this._dsMandatory = field.getMetadata().isMandatory();




                if ((fieldValue === this.getAttribute('checked-value')) || (fieldValue === this.getAttribute('unchecked-value'))) {
                    checked = (fieldValue === this.getAttribute('checked-value'));
                }
                else {
                    var defaultValue = this.getAttribute('default');
                    if (YAHOO.lang.isUndefined(defaultValue)) {
                        throw new Error("Invalid field value (" + fieldValue + ") and default attribute not specified for check-box: " + this.getWidgetID());
                    }
                    checked = parseBoolean(defaultValue);
                    var checkedValue = checked ? this.getAttribute('checked-value') : this.getAttribute('unchecked-value');
                    this._ds.setCurrentRowField(this._selectionField[1], checkedValue);
                }


            }

            if (checked !== this._inputElement.checked) {
                // Disable inputChange event while we set it
                this._inputChangeBinding.disable();
                this._inputElement.checked = checked;
                this._inputChangeBinding.enable();
                this.onCheckedChanged.fireEvent({
                    checked: checked,
                    widget: this.getWidgetContext().getWidgetNode()
                });
            }

            this._checkValid(); // update valid status
            this._checkMandatory(); // update mandatory status
            this._checkEnabled();
        },

        /**
         * Event handler for when the input element changes.
         *
         * @method _onInputChange
         * @private
         */
        _onInputChange: function(){
            // Disable the refreshing from the dataset while we are making the change
            this._dataChangeBinding.disable();
            this._ds.setCurrentRowField(this._selectionField[1], this._inputElement.checked ? this.getAttribute('checked-value') : this.getAttribute('unchecked-value'));
            this._checkValid(); // check validity based on widgets valid status as well
            this._dataChangeBinding.enable();
            this.onCheckedChanged.fireEvent({
                checked: this._inputElement.checked,
                widget: this.getWidgetContext().getWidgetNode()
            });
        },

        /**
         * Event handler for when the dataset changes.
         *
         * @method _onDataChanged
         * @private
         */
        _onDataChanged: function(){
            this.refresh();
        },

        /**
         * Set the value of the check-box.
         * If supplied a value apart from true, this method will uncheck the check-box.
         *
         * @param value {Boolean} value The value to set the check-box to
         */
        setChecked: function(value){
            if (this._ds.getCurrentRowIndex() == -1) {
                throw new Error("Can't call setValue on check-box when bound dataset has no current row.");
            }

            var checked = parseBoolean(value);
            if (checked !== this._inputElement.checked) {
                var oldValue = this._inputElement.checked ? this.getAttribute('checked-value') : this.getAttribute('unchecked-value');
                var newValue = checked ? this.getAttribute('checked-value') : this.getAttribute('unchecked-value');

                // Update the UI
                this._inputChangeBinding.disable();
                this._inputElement.checked = checked;
                this._inputChangeBinding.enable();
                this.onCheckedChanged.fireEvent({
                    checked: checked,
                    widget: this.getWidgetContext().getWidgetNode(),
                    oldValue: oldValue,
                    newValue: newValue
                });

                // Update dataset field to checked value
                this._dataChangeBinding.disable();
                this._ds.setCurrentRowField(this._selectionField[1], this.getAttribute('checked-value'));
                this._dataChangeBinding.enable();
            }
        },

        /**
         * Retrieve this check-box's current value.
         *
         * @return {String} The current value held by the check-box.
         */
        getChecked: function(){
            return this._inputElement.checked;
        },

        /**
         * Implements Validatable.validate
         */
        validate: function(){
            var valid  = this._checkValid();

            if(!valid.isValid){
                // Dataset is invalid find out why and return that.
                if(valid.dataset){
                    return this._ds.getCurrentRow().getFieldObject(this._selectionField[1])
                            .getMetadata().getValidationInfo();
                }else{
                    return [new Toronto.core.WidgetValidationInfo(valid.reason, this.getWidgetID())];
                }
            }

            var isValid = !(this.getMandatory() && !this._inputElement.checked);
            if (!isValid){
                return [new Toronto.core.WidgetValidationInfo('This checkbox must be checked to continue',
                                                            this.getWidgetID())];
            }

            return true;
        },

        setEnabled: function(enabled){
            this._attrEnabled = parseBoolean(enabled);
            this._checkEnabled();
        },

        getEnabled: function(){
            return this._enabled;
        },

        _checkEnabled: function(){
            var enabled = this._attrEnabled && this._dsEnabled && !this._readOnly;
            if (this._enabled !== enabled) {
                this._enabled = enabled;
                this._inputElement.disabled = enabled ? "" : "true";
                this.onEnabledChanged.fireEvent({
                    enabled: enabled,
                    widget: this.getWidgetContext().getWidgetNode()
                });
            }
        },

        _deactivate: function () {
            this._inputElement.onclick = function(e) {
                YAHOO.util.Event.stopEvent(e||window.event);
            };
        },

        _activate: function () {
            this._inputElement.onclick  = this._onClickChange;
        },




        _readOnlyChanged : function(args){
            // console.log("CheckBox:ReadOnlyChange " + args.newValue);
            this._readOnly = args.newValue;
            this._checkEnabled();

        },

        _validChanged : function(args){
            //console.log("CheckBox:ValidChange " + args.newValue);
            this._checkValid();
        },

        _mandatoryChanged : function(args){
            //console.log("CheckBox:MandatoryChange " + args.newValue);
            this._dsMandatory = args.newValue;
            this._checkMandatory();

        },

		getMandatory : function(){
			return this._attrMandatory || this._dsMandatory;
		},

        _checkMandatory : function(){
            var mandatory = this.getMandatory();
            if (this._mandatory != mandatory) {
                this._mandatory = mandatory;
                if(mandatory){
                    this.addClass("mandatory");
                    YAHOO.util.Dom.removeClass(this.getNamedElement("mandatory"), "display-none");
                } else {
                    this.removeClass("mandatory");
                    YAHOO.util.Dom.addClass(this.getNamedElement("mandatory"), "display-none");
                }
				// checkbox doesnt have this event?
                //this.onMandatoryChanged.fireEvent({ widget: this.getWidgetContext().getWidgetNode(),
                //                                    mandatory: mandatory});
            }
        },

        _checkValid : function(){
            var valid = {isValid : true, reason : '', dataset: false};
            if(this._dsEnabled && this._ds.getCurrentRow() !== null){

                var metadata = this._ds.getCurrentRow().getFieldObject(this._selectionField[1]).getMetadata();
                if(!metadata.isValid()){
                    valid.isValid  = false;
					valid.reason = metadata.getInvalidReason().join("\n");
                    valid.dataset = true;
                }
            }

            if(valid.isValid){
                this.removeClass('invalid');
            }else{
                this.addClass('invalid');
            }

            return valid;
        },

        getStyledElements: function () {
            return [
                this.getContainerElement()
            ];
        }



    });
    YAHOO.lang.augmentProto(Toronto.widget.core.v2_5_0.CheckBox, Toronto.util.CssUtils);
})();
