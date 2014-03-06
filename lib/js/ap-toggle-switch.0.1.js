;(function ($) {

	$.fn.apToggleSwitch = function( action, options ) {

		// if action is an object then it's probably a call like this $(element).apToggleSwitch(options)
		// so we have to apply these options
		if (action instanceof Object != false) {
			options = action;
			action = null;
		}

		// Merge options
		var settings = $.extend({
			handleLabelClicks : true,
			handleKeyEvents: true,
			transitions: true,
			activeBorder : false,
			uppercase: true,
			theme: 'default'
		}, options );

		// HTML template which replaces the checkbox
		var template =
			'<div class="ap-toggle-switch">' +
				'<div class="ap-toggle-switch-slider">' +
					'<div class="ap-toggle-switch-left"></div>' +
					'<div class="ap-toggle-switch-middle"><span class="on">On</span></div>' +
					'<div class="ap-toggle-switch-right"><span class="off">Off</span></div>' +
					'<div class="ap-toggle-switch-overlay"></div>' +
				'</div>' +
			'</div>';


		/**
		 * Initialization.
		 *
		 * @param $checkbox
		 */
		function initialize($checkbox)
		{
			this.checkbox = $checkbox;
			this.control = getControl();
			this.control
				.addClass('ap-toggle-switch-' + (this.checkbox.is(':checked') ? 'on' : 'off') );
			if (!settings.transitions) {
				this.control.addClass('no-transitions');
			}
			if (settings.activeBorder) {
				this.control.addClass('active-border');
			}
			if (settings.uppercase) {
				this.control.find('.on').addClass('uppercase');
				this.control.find('.off').addClass('uppercase');
			}

			// Add control and apply checkbox to this control, so it is hidden
			this.checkbox
				.after(this.control)
				.appendTo(this.control);

			assignEvents();
		};

		/**
		 *
		 */
		function getControl()
		{
			// Clone template and "jQueryfy" it
			var $control = $(template);
			$control.addClass('ap-toggle-switch-' + settings.theme);

			// Enable control focus
			var id = this.checkbox.attr('id');
			if (id) {
				$control.attr('id', 'ap-toggle-switch-' + id);
			}

			// Enable control focus
			var tabIndex = this.checkbox.attr('tabindex');
			if (tabIndex && tabIndex > 0) {
				this.checkbox.removeAttr('tabindex');
			}
			$control.attr('tabindex', (tabIndex ? tabIndex : -1));

			return $control;
		}

		/**
		 * Assign all events to the control assigned with given checkbox.
		 */
		function assignEvents()
		{
			// Click
			this.control.click(function() {
				toggle($(this));
			});

			// Handle label clicks
			if (settings.handleLabelClicks && this.checkbox.attr('id')) {
				$('label[for="' + this.checkbox.attr('id') + '"]').click(function() {
					var id = '#' + $(this).attr('for');
					toggle($(id))
					return false;
				});
			}

			// Key shortcuts
			if (settings.handleKeyEvents) {
				this.control.keyup(function(key) {
					var space = 32, enter = 13, left  = 37, right = 39, yes = 89, no = 78;
					switch (key.keyCode) {
						case space:
						case enter:
							toggle($(this));
							break;

						case right:
						case yes:
							setOn($(this));
							break;

						case left:
						case no:
							setOff($(this));
							break;
					}
				});
			}
		};

		/**
		 * Toggles the control.
		 *
		 * @param $element
		 */
		function toggle($element)
		{
			$control = obtainCorrectControl($element);
			if ($control.hasClass('ap-toggle-switch')) {
				$control
					.toggleClass('ap-toggle-switch-on ap-toggle-switch-off')
					.children('input[type="checkbox"]')
						.prop('checked', function(i, val) { return !val; })
						.change();
			}
		};

		/**
		 * Enables the control.
		 *
		 * @param $element
		 */
		function setOn($element)
		{
			$control = obtainCorrectControl($element);
			if ($control.hasClass('ap-toggle-switch-off')) {
				toggle($control);
			}
		};

		/**
		 * Disables the control.
		 *
		 * @param $element
		 */
		function setOff($element)
		{
			$control = obtainCorrectControl($element);
			if ($control.hasClass('ap-toggle-switch-on')) {
				toggle($control);
			}
		};

		/**
		 * Helper function that returns the control, not the checkbox. Reason for this method
		 * is that user can use $(checkbox) or $(control) to access the control methods. So,
		 * if user accesses the methods via checkbox we have the "parse" the checkbox to the
		 *  control element.
		 *
		 * @param $element
		 */
		function obtainCorrectControl($element)
		{
			$control = $element;
			if ($element.is('input[type="checkbox"]') && $element.parent().hasClass('ap-toggle-switch')) {
				$control = $element.parent();
			}
			return $control;
		}

		/**
		 * Handle each selected element.
		 */
		return this.each(function()
		{
			if (action == undefined || action == null) {
				initialize($(this));
			} else if (action == 'toggle') {
				toggle($(this));
			} else if (action == 'on' || action == 'yes') {
				setOn($(this));
			} else if (action == 'off' || action == 'no') {
				setOff($(this));
			}
		});
	};

}(jQuery));
