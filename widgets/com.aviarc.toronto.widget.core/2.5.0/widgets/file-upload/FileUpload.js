/*global
YAHOO
*/

(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    /**
    * @module toronto.widget
    * @class FileUpload
    */
    Toronto.widget.core.v2_5_0.FileUpload = function () {
        this.onEnabledChanged = new Toronto.client.Event("FileUpload onEnabledChanged");
        this.onFileSelected = new Toronto.client.Event("FileUpload onFileSelected");
    };

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.FileUpload, Toronto.framework.DefaultWidgetImpl, {

        /**
        * Implements Widget.startup.
        *
        * Retrieves references to this widget's DOM elements and attached DOM events.
        *
        * @method startup
        * @param widgetContext {WidgetContext}
        */
        startup: function (widgetContext) {
            Toronto.widget.core.v2_5_0.FileUpload.superclass.startup.apply(this, arguments);

            this._attrMandatory = parseBoolean(this.getAttribute('mandatory'));
            this._enabled = parseBoolean(this.getAttribute('enabled'));

            this._initialiseHTML();

            // Attach to the onActivate / onDeactivate events for default browser event disabling in Live Edit
            var widgetNode = widgetContext.getWidgetNode();
            if (widgetNode.onDeactivate instanceof Toronto.client.Event) {
                widgetNode.onDeactivate.bindHandler(this._deactivate, this);
            }

            if (widgetNode.onActivate instanceof Toronto.client.Event) {
                widgetNode.onActivate.bindHandler(this._activate, this);
            }

            this.getWidgetContext().getSystem().onUnload.bindHandler(this._cleanup, this);
        },

        // Remove existing handlers, reset HTML to existing (this clears the field), and then re-init handlers again
        clear : function () {
            this.getWidgetContext().getSystem().removeFileUploadField(this._inputElement);
            this.getContainerElement().innerHTML = this.getContainerElement().innerHTML;

            this._initialiseHTML();
        },

        _initialiseHTML : function() {
            var children = this.getContainerElement().getElementsByTagName("input");
            if (children && children.length > 0) {
                this._inputElement = children[0];
                this.getWidgetContext().getSystem().registerFileUploadField(this._inputElement);
                // Set up disabled-ness here rather than in the XSLT due to weird Chrome bug
                // Situation is a disabled file upload within an expander within a relative container
                // within repeater - on re-render the expander doesn't show in Chrome until you Inpsect the page
                this._inputElement.disabled = !this._enabled;
            }

            var onFileSelectedEvent = this.getWidgetContext().createManagedEvent();
            this._inputElement.onchange = onFileSelectedEvent.makeDOMEventFunction({
                returnValue: false
            });

            onFileSelectedEvent.bindHandler(this._selectFile, this);
        },

        _cleanup: function () {
            this.getWidgetContext().getSystem().removeFileUploadField(this._inputElement);
            this._inputElement = null;
        },

        getMandatory: function() {
            return this._attrMandatory;
        },

        setMandatory: function(mandatory) {
            this._attrMandatory = parseBoolean(mandatory);
        },


        /**
         * Implements Validatable.validate
         */
        validate: function () {
            // Check mandatory & value of field is not empty
            if (this._attrMandatory && (this._inputElement.value === "")) {
                return "You must enter a value in this field";
            }

            return true;
        },

        _deactivate: function () {
            this._inputElement.onclick = function(e) {
                YAHOO.util.Event.stopEvent(e||window.event);
            };
        },

        _activate: function () {
            this._inputElement.onclick = null;
        },

        _selectFile : function() {
            this.onFileSelected.fireEvent({});
        },

        // Returns whether the file upload widget has a value or not - useful for manual validation of widgets
        hasValue : function() {
             return (this._inputElement.value !== "");
        },

        _enabledChanged: function() {
            this[this._enabled ? 'removeClass' : 'addClass' ]('disabled');
            this._inputElement.disabled = this._enabled ? "" : "true";
            this.onEnabledChanged.fireEvent({
                widget: this.getWidgetContext().getWidgetNode(),
                enabled: this._enabled
            });
        },

        setEnabled: function(enabled) {
            var newEnabled = parseBoolean(enabled);
            if (newEnabled !== this._enabled) {
                this._enabled = newEnabled;
                this._enabledChanged();
            }
        },

        getEnabled: function() {
            return this._enabled;
        },

        getStyledElements: function () {
            return [
                this.getContainerElement()
            ];
        }
    });

    YAHOO.lang.augmentProto(Toronto.widget.core.v2_5_0.FileUpload, Toronto.util.CssUtils);
})();
