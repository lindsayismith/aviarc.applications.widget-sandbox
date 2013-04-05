/*global
YAHOO
Toronto
*/

(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    /**
    * @module toronto.widget
    * @class RadioButton
    */
    Toronto.widget.core.v2_5_0.RadioButton = function () {
        /**
        * Event fired when the widget becomes checked.   We are not able to provide
        * an event that covers both the checked and unchecked states as the radio button
        * input does not fire an event when it becomes unchecked.
        *
        * @event onChecked
        * @param info {Object} Info object
        */
        this.onChecked = new Toronto.client.Event();
        this.onUserChecked = new Toronto.client.Event();

        /**
        * Event fired when the enabled state of the widget changes
        *
        * @event onEnabledChanged
        * @param info {Object} Info object
        */
        this.onEnabledChanged = new Toronto.client.Event();
    };

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.RadioButton, Toronto.framework.DefaultWidgetImpl, {

        /**
        * Implements Widget.startup.
        *
        * Retrieves references to this widget's DOM elements and attached DOM events.
        *
        * @method startup
        * @param widgetContext {WidgetContext}
        */
        startup: function (widgetContext) {
            Toronto.widget.core.v2_5_0.RadioButton.superclass.startup.apply(this, arguments);

            this._selectionField    = this.getAttribute('selection-field').split(".");
            this._input      = this.getNamedElement("input");

            // Use onclick here not onchange as IE doesn't respond to onchange until onblur has fired
            var inputChangeEvent        = widgetContext.createManagedEvent();
            this._input.onclick  		= inputChangeEvent.makeDOMEventFunction();
            this._inputChangeBinding    = inputChangeEvent.bindHandler(this._onInputChange, this);

            this._attrEnabled   = parseBoolean(this.getAttribute('enabled'));
            this._dsEnabled     = true;

			this._readOnly 		= false;
            this._valid 		= true;

            this.getWidgetContext().getSystem().onUnload.bindHandler(this._cleanup, this);

			this._enabled = true;
			this._checkEnabled();
        },

        _cleanup: function () {
            this._input = null;
        },

        getChecked: function() {
        	return this._input.checked;
        },

        /**
         * Checks this radio-button.  We don't have a setChecked(true/false) method because to uncheck
         * a radio-button you need to check another one in the same group.
         */
        check: function() {
        	if (!this.getChecked()) {
        		this._input.checked = true;
        		// This doesn't appear to fire on its own by setting the above property
        		this._onInputChange();
        	}
        },

        /**
        * Event handler for when the input element changes.
        *
        * @method _onInputChange
        * @private
        */
        _onInputChange: function () {
			if (this._ds.getCurrentRowField(this._selectionField[1]) === this.getAttribute('checked-value')){
				return;
			}
            // Disable the refreshing from the dataset while we are making the change
            this._dataChangeBinding.disable();

            if (this._input.checked) {
                this._ds.setCurrentRowField(this._selectionField[1], this.getAttribute('checked-value'));
            }
            this._dataChangeBinding.enable();
            this.onChecked.fireEvent({
            	widget: this.getWidgetContext().getWidgetNode(),
                checked: this._input.checked
            });
            this.onUserChecked.fireEvent({
                widget: this.getWidgetContext().getWidgetNode(),
                checked: this._input.checked
            });
        },



        /**
        * Implements Widget.bind
        *
        * Sets reference to required dataset and binds to data change event.
        *
        * @method bind
        * @param {dataContext} The data context to bind to
        */
        bind: function (dataContext) {        	
            Toronto.widget.core.v2_5_0.RadioButton.superclass.bind.apply(this, arguments);
			
            this._ds =  dataContext.findDataset(this._selectionField[0]);
            this._dataChangeBinding = this._ds.onDataChanged.bindHandler(this.refresh, this);
            this._ds.onCurrentRowChanged.bindHandler(this.refresh, this);

  	    this._dsEnabled = this._ds.getCurrentRow() != null;
	    this._checkEnabled();
        },

        /**
        * Implements Widget.refresh
        *
        * Updates the checkbox element to match the bound field.
        *
        * @method refresh
        */
        refresh: function () {
			this._dsEnabled = this._ds.getCurrentRow() !== null;
			var checked = false;

        	if (this._dsEnabled) {
				var field = this._ds.getCurrentRow().getFieldObject(this._selectionField[1]);
        		checked = field.getFormattedValue()  === this.getAttribute('checked-value');

				this._readOnly = field.getMetadata().isReadOnly();

				this._bindFieldEvents();
        	}else{
				this._bindFieldEvents(false);
        	}

            if (checked !== this._input.checked) {
                // Disable inputChange event while we set it
                this._inputChangeBinding.disable();
                this._input.checked = checked;
                this._inputChangeBinding.enable();
                this.onChecked.fireEvent({
                	widget: this.getWidgetContext().getWidgetNode(),
                    checked: checked
                });
            }

			this._checkValid();
			this._checkEnabled();

        },

        setEnabled: function (enabled) {
	    // console.log('setEnabled : ' + enabled)
            this._attrEnabled = parseBoolean(enabled);
			this._checkEnabled();
        },

        getEnabled: function () {
            return this._enabled;
        },


		_checkEnabled: function(){
            var enabled = this._attrEnabled && this._dsEnabled && !this._readOnly;
            if (this._enabled !== enabled) {
                this._enabled = enabled;
                this._input.disabled = enabled ? "" : "true";
                this.onEnabledChanged.fireEvent({
                    enabled: enabled,
                    widget: this.getWidgetContext().getWidgetNode()
                });
            }
        },

        _bindFieldEvents : function(enable){
			// not yet bound to a dataset
			if(! this._isBound){
				return;
			}

			var row = this._ds.getCurrentRow();

            if((enable || YAHOO.lang.isUndefined(enable)) &&
				row != null){

                if (this._validHandler != null){
                    this._bindFieldEvents(false);
                }

                var metadata = row.getFieldObject(this._selectionField[1]).getMetadata();
                this._validHandler = metadata.onValidChanged.bindHandler(this._validChanged, this);
                this._readOnlyHandler = metadata.onReadOnlyChanged.bindHandler(this._readOnlyChanged, this);

            }else if(this._validHandler != null){
                this._validHandler.unbind();
                this._readOnlyHandler.unbind();

                this._validHandler = null;
                this._readOnlyHandler = null;
            }
        },

        _readOnlyChanged : function(args){
            // console.log("RadioButton:ReadOnlyChange " + args.newValue);
            this._readOnly = args.newValue;
            this._checkEnabled();

        },

        _validChanged : function(args){
            // console.log("RadioButton:ValidChange " + args.newValue);
            this._checkValid();
        },

        _checkValid : function(){
            valid = {isValid : true, reason : ''}
            if(this._dsEnabled){
                var metadata = this._ds.getCurrentRow().getFieldObject(this._selectionField[1]).getMetadata()
                if(!metadata.isValid()){
                    valid.isValid = false
                    valid.reason = metadata.getInvalidReason().join("\n")

					this.addClass('invalid')
					return valid;
                }
            }

            this.removeClass('invalid')
            return valid;
        },

		getStyledElements: function () {
            return [
                this.getContainerElement()
            ];
        }

    });

	YAHOO.lang.augmentProto(Toronto.widget.core.v2_5_0.RadioButton, Toronto.util.CssUtils);
})();
