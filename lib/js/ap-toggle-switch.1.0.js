/**
* @license ap-toggle-switch.js v1.0
* Updated: 14.11.2014
* {DESCRIPTION}
* Copyright (c) 2014 armin pfaeffle
* Released under the MIT license
* http://armin-pfaeffle.de/licenses/mit
*/

;(function($) {

	var datakey = '__apts__';
	var cssClass = 'apts';
	var cssPrefix = cssClass + '-';
	var eventNamespace = 'apts';
	var globalCounter = 0;


	/**
	 * Makes the first character of str uppercase and returns that string.
	 */
	function ucfirst(str) {
		str += ''; // ensure that str is a string
		var c = str[0].toUpperCase();
		return c + str.substr(1);
	}

	/**
	 * Adds ucfirst() method to String class. Makes the first character
	 * of str uppercase and returns that string.
	 */
	if (!String.prototype.ucfirst) {
		String.prototype.ucfirst = function() {
			return ucfirst(this);
		};
	}

	/**
	 *
	 */
	$.fn.tagName = function() {
		return this.prop('tagName').toLowerCase();
	}


	/**
	 * Constructor for ApToggleSwitch plugin.
	 */
	function ApToggleSwitch(element, options) {
		// Do not remake the plugin
		var data = $(element).data(datakey);
		if (data) {
			return data;
		}

		// Plugin only works on: checkbox, radio button
		var supportedTypes = 'checkbox, radio'.split(', ');
		if ($(element).tagName() != 'input') {
			console.log('Element is not supported.');
			return false;
		}
		else if (supportedTypes.indexOf( $(element).attr('type') ) == -1) {
			console.log('Elements type is not supported.');
			return false;
		}

		this.$target = $(element);
		this.settings = $.extend({}, ApToggleSwitch.defaultSettings, options);
		this.customValues = false;
		this._init();

		// Save the instance
		this.$target.data(datakey, this);
	}

	/**
	 * ApToggleSwitch class.
	 */
	ApToggleSwitch.prototype = {

		/**
		 *
		 */
		_init: function() {
			this._obtainControlProperties();
			this._obtainValues();
			this._applyMutuallyExclusive();

			this._createControl();
			this._updateTexts();
			this._updateCssClasses();
			this._bind();

			// It's important that setting size is done AFTER appending control
			// to DOM, because else Webkit browser do not apply correct size
			this._updateSize();

			if (this.settings.autoFocus) {
				this.$control.focus();
			}

			this._trigger('init');
		},

		/**
		 *
		 */
		_obtainControlProperties: function() {
			// Prepare properties which should be considered
			var properties = this.settings.autoApplyProperties;
			if (typeof properties == 'string') {
				properties = $.map(properties.split(','), $.trim);
			}
			if (typeof properties != 'object') {
				return;
			}

			if (properties.indexOf('readonly') > -1 && this.$target.attr('readonly')) {
				this.settings.readonly = true;
			}
			if (properties.indexOf('disabled') > -1 && this.$target.attr('disabled')) {
				this.settings.disabled = true;
			}
			if (properties.indexOf('autofocus') > -1 && !this.$target.attr('autofocus')) {
				this.settings.autoFocus = true;
			}
		},

		/**
		 *
		 */
		_obtainValues: function() {
			var values = this.settings.values;
			if (this.$target.data('values')) {
				values = this.$target.data('values');
			}
			else if (this.$target.data('on') || this.$target.data('off')) {
				var valueOn = this.$target.data('on') ? this.$target.data('on') : '';
				var valueOff = this.$target.data('off') ? this.$target.data('off') : '';
				values = valueOn + this.settings.valueSplitter + valueOff;
			}
			this._parseCustomValues(values);

			if (this.$target.attr('value') && this.customValues && this.customValues.on != this.$target.attr('value')) {
				this.customValues.on = this.$target.attr('value');
			}
		},

		/**
		 *
		 */
		_parseCustomValues: function(values) {
			if (values) {
				if (typeof values == 'string') {
					var values = values.split(this.settings.valueSplitter);
					if (values.length >= 1) {
						this.customValues = {
							on: (values[0].length > 0 ? values[0] : null),
							off: (values.length >= 2 && values[1].length > 0 ? values[1] : null)
						};
						return;
					}
				}
				else if (typeof values == 'object') {
					var keys = [0, 'on', 'true'];
					var onValue = null;
					for (index in keys) {
						if (values.hasOwnProperty( keys[index] )) {
							onValue = values[ keys[index] ];
							break;
						}
					}

					var keys = [1, 'off', 'false'];
					var offValue = null;
					for (index in keys) {
						if (values.hasOwnProperty( keys[index] )) {
							offValue = values[ keys[index] ];
							break;
						}
					}

					if (onValue != null || offValue != null) {
						this.customValues = {
							on: onValue,
							off: offValue
						};
						return;
					}
				}
			}
			this.customValues = false;
		},

		/**
		 *
		 */
		_applyMutuallyExclusive: function() {
			if (!this.settings.mutuallyExclusive || !this.$target.is(':checked')) {
				return;
			}

			// If mutuallyExclusive is a selector, we disable every other control than the
			// last checked one, so there is at least only one single checked control
			if (typeof this.settings.mutuallyExclusive == 'string' && !$(this.settings.mutuallyExclusive + ':checked:last').is(this.$target)) {
				this.$target
					.prop('checked', false)
					.removeAttr('checked');
			}
			// If name is given and target control is not the last checked, we
			// uncheck the control, because the last checked control is right
			else if (this.$target.attr('name') && !$('input[name="' + this.$target.attr('name') + '"]:checked:last').is(this.$target)) {
				this.$target
					.prop('checked', false)
					.removeAttr('checked');
			}
		},

		/**
		 *
		 */
		_updateValue: function(checked) {
			// Disable other toggle switches if necessary
			if (checked && (this.settings.mutuallyExclusive || this.$target.attr('type') == 'radio')) {
				var selector = this._getMutuallyExclusiveSelector();
				if (selector) {
					$(selector).apToggleSwitch('setOff', this);
				}
			}

			if (checked) {
				this.$target
					.prop('checked', true)
					.attr('checked', 'checked');

				if (this.$target.attr('type') == 'checkbox' && this.customValues) {
					if (this.customValues.on) {
						if (this.$target.attr('value') != this.customValues.on) {
							this.$target.attr('value', this.customValues.on);
						}
					}
					else {
						this.$target.removeAttr('value');
					}
				}
			}
			else {
				if (this.$target.attr('type') == 'checkbox' && this.customValues && this.customValues.off && this.$target.attr('value') != this.customValues.off) {
					this.$target.attr('value', this.customValues.off);
				}
				else {
					// Apply on-value when there is a valid one, because if user changes the values
					// from two different values or no value to an on-value, we have to directly set
					// it, else user has to toggle control before correct value is set
					if (this.customValues && this.customValues.on && this.$target.attr('value') != this.customValues.on) {
						this.$target.attr('value', this.customValues.on);
					}

					this.$target
						.prop('checked', false)
						.removeAttr('checked');
				}
			}
			this.$target.trigger('change');
		},

		/**
		 *
		 */
		_getMutuallyExclusiveSelector: function() {
			var selector = null;
			if (typeof this.settings.mutuallyExclusive == 'string') {
				var selector = this.settings.mutuallyExclusive + ':checked';
			}
			else if (this.$target.attr('name')) {
				var selector = 'input[name="' + this.$target.attr('name') + '"]:checked';
			}
			return selector;
		},

		/**
		 *
		 */
		_createControl: function() {
			this.$control = $(ApToggleSwitch.controlTemplate);
			this.$controlOn = this.$control.find('.' + cssPrefix + 'on');
			this.$controlOff = this.$control.find('.' + cssPrefix + 'off');

			this.$control.attr('id', cssPrefix + (this.$target.attr('id') ? this.$target.attr('id') : globalCounter++));
			this._applyTabIndex();

			// Backup value before first potential modification
			this.valueBackup = this.$target.attr('value');

			// Apply corresponding CSS class
			this.$control.addClass(cssPrefix + (this.$target.is(':checked') ? 'on' : 'off'));

			// ... and set value
			if (this.$target.is(':checked')) {
				if (this.customValues && this.customValues.on) {
					this.$target.attr('value', this.customValues.on);
				}
			}
			else {
				// If there is an off-value, we have to check checkbox permanently, because when
				// submitting a form, checkbox must be checked to send a value
				if (this.$target.attr('type') == 'checkbox' && this.customValues && this.customValues.off) {
					this.$target
						.prop('checked', true)
						.attr('checked', 'checked')
						.attr('value', this.customValues.off);
				}
			}

			// Add control and move target element into this control, so it is hidden
			this.$target
				.after(this.$control)
				.appendTo(this.$control);
		},

		/**
		 *
		 */
		_restoreTargetElement: function() {
			if (this.settings.restoreValueAfterDestruction) {
				if (this.valueBackup) {
					this.$target.attr('value', this.valueBackup);
				}
				else {
					this.$target.removeAttr('value');
				}
			}

			if (this.isOn()) {
				this.$target
					.prop('checked', true)
					.attr('checked', 'checked');
			}
			else {
				this.$target
					.prop('checked', false)
					.removeAttr('checked');
			}

			this.$control
				.after(this.$target)
				.remove();
		},

		/**
		 *
		 */
		_applyTabIndex: function() {
			var tabIndex = this.$target.attr('tabindex');
			if (tabIndex && tabIndex > 0) {
				this.$target.removeAttr('tabindex');
			}
			else {
				tabIndex = -1;
			}
			this.$control.attr('tabindex', tabIndex);
		},

		/**
		 *
		 */
		_resetTabIndex: function() {
			var tabIndex = this.$control.attr('tabindex', tabIndex);
			if (tabIndex > -1) {
				this.$control.removeAttr('tabindex');
				this.$target.attr('tabindex', tabIndex);
			}
		},

		/**
		 *
		 */
		_updateTexts: function() {
			var result = this._triggerHandler('beforeUpdateTexts');
			if (result === false) {
				return;
			}
			else if (typeof result == 'string') {
				var onOffTerms = result.split(this.settings.textSplitter);
			}
			else {
				var onOffTerms = this.settings.text.split(this.settings.textSplitter);
			}

			if (onOffTerms.length >= 1 && typeof onOffTerms[0] == 'string') {
				this.$controlOn.children('.' + cssPrefix + 'text').html(onOffTerms[0]);
			}
			if (onOffTerms.length >= 2 && typeof onOffTerms[1] == 'string') {
				this.$controlOff.children('.' + cssPrefix + 'text').html(onOffTerms[1]);
			}

			this._trigger('updateTexts');
		},

		/**
		 *
		 */
		_updateCssClasses: function() {
			this._modifyCssClass((this.customValues ? 'add' : 'remove'), 'custom-values');

			this._modifyCssClass('add', 'size-' + this.settings.size);

			this._modifyCssClass((this.settings.readonly ? 'add' : 'remove'), 'readonly');
			this._modifyCssClass((this.settings.readonly && this.settings.showLock ? 'add' : 'remove'), 'readonly-lock');

			this._modifyCssClass((this.settings.disabled ? 'add' : 'remove'), 'disabled');
			this._modifyCssClass((this.settings.uppercase ? 'add' : 'remove'), 'uppercase');
			this._modifyCssClass('add', 'theme-' + this.settings.theme);
			this._modifyCssClass((this.settings.color && typeof this.settings.color == 'string' ? 'add' : 'remove'), 'color-' + this.settings.color);
			this._modifyCssClass('add', 'slider-' + this.settings.sliderType);

			this._modifyCssClass((this.settings.activeBorder ? 'add' : 'remove'), 'active-border');
			this._modifyCssClass((this.settings.roundCorners ? 'add' : 'remove'), 'round-corners');
			this._modifyCssClass((!this.settings.slideAnimation ? 'add' : 'remove'), 'no-slide-animation');


			this._trigger('updateCssClasses');
		},

		/**
		 *
		 */
		_modifyCssClass: function(action, cssClass) {
			cssClass = cssPrefix + cssClass;
			var hasClass = this.$control.hasClass(cssClass);
			if (!hasClass && action == 'add') {
				this.$control.addClass(cssClass);
			}
			if (hasClass && action == 'remove') {
				this.$control.removeClass(cssClass);
			}
		},

		/**
		 *
		 */
		_updateSize: function() {
			if (this.settings.statusVisibilityWidth == 'auto') {
				var statusVisibilityWidth = 11 + (this.$control.height() - 25) * 0.27;
			} else {
				var statusVisibilityWidth = parseInt(this.settings.statusVisibilityWidth);
			}
			var textLeft = this._obtainTextPadding();
			var textWidth = this._obtainMaxTextWidth();

			var controlWidth = textWidth + 2 * textLeft + statusVisibilityWidth;
			var controlOnWidth = textWidth + 2 * textLeft + statusVisibilityWidth;
			var controlOffWidth = textWidth + 2 * textLeft + 3 * statusVisibilityWidth;

			// Set sizes of control and child controls
			this.$control.css('width', Math.round(controlWidth * this.settings.widthMultiplier));

			this.$controlOn.css('width', Math.round(controlOnWidth * this.settings.widthMultiplier));
			this.$controlOn.children('.' + cssPrefix + 'text').css({
				left: Math.round(textLeft * this.settings.widthMultiplier),
				width: Math.round(textWidth * this.settings.widthMultiplier)
			});

			this.$controlOff.css({
				left: Math.round(-statusVisibilityWidth * this.settings.widthMultiplier),
				width: Math.round(controlOffWidth * this.settings.widthMultiplier)
			});
			this.$controlOff.children('.' + cssPrefix + 'text').css({
				left: Math.round( (textLeft + statusVisibilityWidth + 2) * this.settings.widthMultiplier),
				width: Math.round(textWidth * this.settings.widthMultiplier)
			});

			// Store slider left position value for updateHeadCss
			this.$controlOn.data('sliderLeft', Math.round(statusVisibilityWidth * this.settings.widthMultiplier) );
			this.$controlOff.data('sliderLeft', Math.round(0 - (textWidth + 2 * textLeft) * this.settings.widthMultiplier - 2) );

			this._updateHeadCss();

			this._trigger('updateSize');
		},

		/**
		 *
		 */
		_obtainTextPadding: function() {
			if (this.settings.padding == 'auto') {
				var autoPaddingValues = {
					'auto' :    7,
					'small' :   7,
					'medium' :  10,
					'large' :   12,
					'xl' :      15,
					'xxl' :     18,
					'xxxl' :    25,
				};
				var padding = autoPaddingValues[this.settings.size];
				if (!padding) {
					padding = autoPaddingValues['auto'];
				}
			}
			else {
				var padding = parseInt(this.settings.padding);
			}
			return padding;
		},

		/**
		 *
		 */
		_obtainMaxTextWidth: function() {
			$hiddenContainer = $('<div></div>')
				.css('visibility', 'hidden')
				.appendTo( $('body') )
				.append(
					$('<div></div>')
						.addClass(cssClass)
						.addClass(cssPrefix + 'size-' + this.settings.size)
						.addClass(cssPrefix + 'theme-' + this.settings.theme)
						.append( this.$controlOn.clone() )
						.append( this.$controlOff.clone() )
				);

			if (this.settings.uppercase) {
				$hiddenContainer.find('.' + cssClass).addClass(cssPrefix + 'uppercase');
			}
			var textWidths = {
				on: $hiddenContainer.find('.' + cssPrefix + 'on .' + cssPrefix + 'text').removeAttr('style').width(),
				off: $hiddenContainer.find('.' + cssPrefix + 'off .' + cssPrefix + 'text').removeAttr('style').width()
			};
			$hiddenContainer.remove();
			return Math.max(textWidths.on, textWidths.off);
		},

		/**
		 *
		 */
		_updateHeadCss: function() {
			this._removeHeadCss();

			var controlId = this.$control.attr('id');
			var css = "#" + controlId + "." + cssPrefix + "on > ." + cssPrefix + "slider { left: " + this.$controlOn.data('sliderLeft') + "px; }\n"
			        + "#" + controlId + "." + cssPrefix + "off > ." + cssPrefix + "slider { left: " + this.$controlOff.data('sliderLeft') + "px; }\n";

			if (this.settings.slideAnimation) {
				var duration = (parseInt(this.settings.animationDuration) / 1000).toFixed(3) + 's';
				css += "#" + controlId + " ." + cssPrefix + "slider {\n"
				     + "\t-webkit-transition: left " + duration + ";\n"
				     + "\t   -moz-transition: left " + duration + ";\n"
				     + "\t    -ms-transition: left " + duration + ";\n"
				     + "\t     -o-transition: left " + duration + ";\n"
				     + "\t        transition: left " + duration + ";\n"
				     + "\t}\n";
			}

			var result = this._triggerHandler('beforeUpdateHeadCss', [css]);
			if (result === false) {
				return;
			}
			else if (typeof result == 'string') {
				css = result;
			}
			this.headCssStyle = $("<style type='text/css'>\n" + css + "</style>").appendTo('head');
			this._trigger('updateHeadCss', [css]);
		},

		/**
		 *
		 */
		_removeHeadCss: function() {
			if (this.headCssStyle) {
				this.headCssStyle.remove();
				this.headCssStyle = null;

				this._trigger('removeHeadCss');
			}
		},

		/**
		 *
		 */
		_bind: function() {
			var self = this;

			// Click
			this.$control.on('click.' + eventNamespace, function(e) {
				self.toggle();
				e.preventDefault();
				e.stopImmediatePropagation();
			});

			// Handle label clicks
			var id = this.$target.attr('id');
			if (this.settings.handleLabelClicks && id) {
				$('label[for="' + id + '"]').on('click.' + eventNamespace, function(evt) {
					self.toggle();
					evt.preventDefault();
					return false;
				});
			}

			// Key shortcuts
			if (this.settings.handleKeyEvents) {
				var space = 32,
					enter = 13,
					left  = 37,
					right = 39,
					yes   = 89,
					no    = 78;

				this.$control.on('keydown.' + eventNamespace, function(evt) {
					switch (evt.keyCode) {
						case space:
						case enter:
							self.toggle();
							evt.preventDefault();
							break;

						case right:
						case yes:
							self.setOn();
							evt.preventDefault();
							break;

						case left:
						case no:
							self.setOff();
							evt.preventDefault();
							break;
					}
				});
			}
		},

		/**
		 *
		 */
		_unbind: function() {
			this.$control.off('click.' + eventNamespace);
			if (this.$target.attr('id')) {
				$('label[for="' + this.$target.attr('id') + '"]').off('click.' + eventNamespace);
			}
			this.$control.off('keydown.' + eventNamespace);
		},

		/**
		 *
		 */
		_getValue: function(state) {
			if (state) {
				return (this.customValues ? this.customValues.on : true);
			}
			else {
				return (this.customValues ? this.customValues.off : false);
			}
		},

		/**
		 *
		 */
		_trigger: function(eventType, args, $context) {
			var optionName = 'on' + eventType.ucfirst(),
				f = this.settings[optionName];
			$context = ($context ? $context : this.$target);
			if (typeof f == 'function') {
				f.apply($context, args);
			}
			eventType = eventNamespace + eventType.ucfirst();
			$context.trigger(eventType, args);
		},

		/**
		 *
		 */
		_triggerHandler: function(eventType, args, $context) {
			var optionName = 'on' + eventType.ucfirst(),
				f = this.settings[optionName],
				callbackResult = undefined,
				result;
			$context = ($context ? $context : this.$target);
			if (typeof f == 'function') {
				callbackResult = f.apply($context, args);
			}
			eventType = eventNamespace + eventType.ucfirst();
			result = ((result = $context.triggerHandler(eventType, args)) !== undefined ? result : callbackResult);
			return result;
		},

		/**
		 *
		 */
		toggle: function() {
			if (this.settings.readonly || this.settings.disabled) {
				return false;
			}

			// Check if deselection of selected item is allowed while mutually exclusive is on
			var isOn = this.isOn();
			if (isOn && (this.settings.mutuallyExclusive || this.$target.attr('type') == 'radio') && !this.settings.exclusiveDeselectable) {
				if (!this.sender) {
					return;
				}
			}

			// Determine value when control would be already toggle and to the callback
			var toggledValue = this._getValue(!isOn);
			if (this._triggerHandler('beforeSetValue', [toggledValue]) === false) {
				return;
			}

			// Before we change the visual state, we modify the internal value
			this._updateValue(!isOn);

			// Visually toggle control; CSS does the job here!
			this.$control.toggleClass(cssPrefix + 'on ' + cssPrefix + 'off');

			this._trigger('setValue', [toggledValue]);
		},

		/**
		 *
		 */
		setOn: function() {
			if (this.$control.hasClass(cssPrefix + 'off')) {
				this.toggle();
			}
		},

		/**
		 *
		 */
		setOff: function($sender) {
			this.sender = $sender;
			try {
				if (this.$control.hasClass(cssPrefix + 'on')) {
					this.toggle();
				}
			} finally {
				this.sender = null;
			}
		},

		/**
		 *
		 */
		isOn: function() {
			return this.$control.hasClass(cssPrefix + 'on');
		},

		/**
		 *
		 */
		isOff: function() {
			return this.$control.hasClass(cssPrefix + 'off');
		},

		/**
		 *
		 */
		getValue: function() {
			return this._getValue( this.isOn() );
		},

		/**
		 *
		 */
		setValue: function(value) {
			if (this.customValues) {
				if (value == this.customValues.on) {
					this.setOn();
				}
				else if (value == this.customValues.off) {
					this.setOff();
				}
			}
			else {
				if (value === true || value == 'true' || value == 1 || value == '1') {
					this.setOn();
				}
				else if (value === false || value == 'false' || value == 0 || value == '0') {
					this.setOff();
				}
			}
		},

		/**
		 *
		 */
		val: function(value) {
			if (value != undefined) {
				this.setValue(value)
			}
			else {
				return this.getValue();
			}
		},

		/**
		 *
		 */
		option: function(key, value) {
			if (!key) {
				// Return copy of current settings
				return $.extend({}, this.settings);
			}
			else {
				var options;
				if (typeof key == 'string') {
					if (arguments.length === 1) {
						// Return specific value of settings
						return (this.settings[key] !== undefined ? this.settings[key] : null);
					}
					options = {};
					options[key] = value;
				} else {
					options = key;
				}
				this._setOptions(options);
			}
		},

		/**
		 *
		 */
		_setOptions: function(options) {
			for (key in options) {
				var value = options[key];

				// Disable/modify plugin before we apply new settings
				switch (key) {
					case 'size':
						this._modifyCssClass('remove', 'size-' + this.settings.size);
						break;

					case 'theme':
						this._modifyCssClass('remove', 'theme-' + this.settings.theme);
						break;

					case 'color':
						if (this.settings.color) {
							this._modifyCssClass('remove', 'theme-' + this.settings.color);
						}
						break;

					case 'sliderType':
						this._modifyCssClass('remove', 'slider-' + this.settings.sliderType);
						break;

					case 'handleLabelClicks':
					case 'handleKeyEvents':
						this._unbind();
						break;
				}

				// Apply option
				this.settings[key] = value;

				// Disable/modify plugin before we apply new settings
				switch (key) {

					case 'values':
					case 'valueSplitter':
						this._parseCustomValues(this.settings.values);
						this._updateValue( this.isOn() );
						break;

					case 'handleLabelClicks':
					case 'handleKeyEvents':
						this._bind();
						break;

					case 'mutuallyExclusive':
						// If mutuallyExclusive is enabled, this control is checked and it's not the last checked
						// control, we disabe it :)
						if (this.settings.mutuallyExclusive && this.$target.attr('type') != 'radio' && this.isOn()) {
							var selector = this._getMutuallyExclusiveSelector();
							if (selector && !$(selector).last().is(this.$target)) {
								this.setOff(this);
							}
						}
						break;

					case 'size':
					case 'readonly':
					case 'showLock':
					case 'disabled':
					case 'uppercase':
					case 'theme':
					case 'color':
					case 'sliderType':
					case 'activeBorder':
					case 'roundCorners':
					case 'slideAnimation':
					case 'animationDuration':
						this._updateCssClasses();

					case 'text':
					case 'textSplitter':
						this._updateTexts();

					case 'size':
					case 'statusVisibilityWidth':
					case 'widthMultiplier':
					case 'text':
					case 'textSplitter':
					case 'padding':
					case 'theme':
						this._updateSize();
				}
			}
		},

		/**
		 *
		 */
		destroy: function(restoreValueAfterDestruction) {
			if (typeof restoreValueAfterDestruction == 'boolean') {
				this.settings.restoreValueAfterDestruction = restoreValueAfterDestruction;
			}

			this._trigger('destroy');

			this._unbind();
			this._removeHeadCss();
			this._resetTabIndex();
			this._restoreTargetElement();

			this.$target.removeData(datakey);
		}
	};

	/**
	 *
	 */
	$.fn.apToggleSwitch = function( options ) {
		if (typeof options === 'string') {
			var instance, method, result, returnValues = [];
			var params = Array.prototype.slice.call(arguments, 1);
			this.each(function() {
				instance = $(this).data(datakey);
				if (!instance) {
					returnValues.push(undefined);
				}
				// Ignore private methods
				else if ((typeof (method = instance[options]) === 'function') && (options.charAt(0) !== '_')) {
					var result = method.apply(instance, params);
					if (result !== undefined) {
						returnValues.push(result);
					}
				}
			});
			// Return an array of values for the jQuery instances
			// Or the value itself if there is only one
			// Or keep chaining
			return returnValues.length ? (returnValues.length === 1 ? returnValues[0] : returnValues) : this;
		}
		return this.each(function() {
			new ApToggleSwitch(this, options);
		});
	};

	/**
	 * Default settings for ApToggleSwitch plugin.
	 */
	ApToggleSwitch.defaultSettings = {

		size: 'auto', // other predefined options: small, medium, large, xl, xxl, xxxl
		statusVisibilityWidth: 'auto', // auto | pixels
		widthMultiplier: 1.0,

		autoApplyProperties: ['readonly', 'disabled', 'autofocus'],

		text: 'On|Off',
		textSplitter: '|',
		values: null,
		valueSplitter: '|',

		readonly: false,
		showLock: true,
		disabled: false,
		autoFocus: false,
		mutuallyExclusive : null,
		exclusiveDeselectable: true,

		padding: 'auto', // auto | pixels
		uppercase: true,

		theme: 'default',
		color: null,
		sliderType: 'skew', // skew | straight | skew-reverse
		activeBorder : false,
		roundCorners: true,
		slideAnimation: true,
		animationDuration: 200, // in ms

		handleLabelClicks : true,
		handleKeyEvents: true,

		restoreValueAfterDestruction: true
	};

	/**
	 *
	 */
	ApToggleSwitch.controlTemplate =
			'<div class="' + cssClass + '">' +
				'<div class="' + cssPrefix + 'slider">' +
					'<div class="' + cssPrefix + 'on"><span class="' + cssPrefix + 'text">On</span></div>' +
					'<div class="' + cssPrefix + 'off"><span class="' + cssPrefix + 'text">Off</span></div>' +
				'</div>' +
				'<div class="' + cssPrefix + 'overlay"></div>' +
			'</div>';

}(jQuery));
