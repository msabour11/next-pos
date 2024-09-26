function overridePOSCustomerSelector() {
  if (
    typeof erpnext !== "undefined" &&
    typeof erpnext.PointOfSale !== "undefined" &&
    typeof erpnext.PointOfSale.Payment !== "undefined"
  ) {
    erpnext.PointOfSale.Payment.prototype.bind_events = function () {
      const me = this;

      this.$payment_modes.on("click", ".mode-of-payment", function (e) {
        const mode_clicked = $(this);
        // if clicked element doesn't have .mode-of-payment class then return
        if (!$(e.target).is(mode_clicked)) return;

        const scrollLeft =
          mode_clicked.offset().left -
          me.$payment_modes.offset().left +
          me.$payment_modes.scrollLeft();
        me.$payment_modes.animate({ scrollLeft });

        const mode = mode_clicked.attr("data-mode");

        // hide all control fields and shortcuts
        $(`.mode-of-payment-control`).css("display", "none");
        $(`.cash-shortcuts`).css("display", "none");
        me.$payment_modes.find(`.pay-amount`).css("display", "inline");
        me.$payment_modes.find(`.loyalty-amount-name`).css("display", "none");

        // remove highlight from all mode-of-payments
        $(".mode-of-payment").removeClass("border-primary");

        if (mode_clicked.hasClass("border-primary")) {
          // clicked one is selected then unselect it
          mode_clicked.removeClass("border-primary");
          me.selected_mode = "";
        } else {
          // clicked one is not selected then select it
          mode_clicked.addClass("border-primary");
          mode_clicked.find(".mode-of-payment-control").css("display", "flex");
          mode_clicked.find(".cash-shortcuts").css("display", "grid");
          me.$payment_modes.find(`.${mode}-amount`).css("display", "none");
          me.$payment_modes.find(`.${mode}-name`).css("display", "inline");

          me.selected_mode = me[`${mode}_control`];
          me.selected_mode && me.selected_mode.$input.get(0).focus();
          me.auto_set_remaining_amount();
        }
      });

      frappe.ui.form.on("POS Invoice", "contact_mobile", (frm) => {
        const contact = frm.doc.contact_mobile;
        const request_button = $(this.request_for_payment_field?.$input[0]);
        if (contact) {
          request_button.removeClass("btn-default").addClass("btn-primary");
        } else {
          request_button.removeClass("btn-primary").addClass("btn-default");
        }
      });

      frappe.ui.form.on("POS Invoice", "coupon_code", (frm) => {
        if (frm.doc.coupon_code && !frm.applying_pos_coupon_code) {
          if (!frm.doc.ignore_pricing_rule) {
            frm.applying_pos_coupon_code = true;
            frappe.run_serially([
              () => (frm.doc.ignore_pricing_rule = 1),
              () => frm.trigger("ignore_pricing_rule"),
              () => (frm.doc.ignore_pricing_rule = 0),
              () => frm.trigger("apply_pricing_rule"),
              () => frm.save(),
              () => this.update_totals_section(frm.doc),
              () => (frm.applying_pos_coupon_code = false),
            ]);
          } else if (frm.doc.ignore_pricing_rule) {
            frappe.show_alert({
              message: __(
                "Ignore Pricing Rule is enabled. Cannot apply coupon code."
              ),
              indicator: "orange",
            });
          }
        }
      });

      this.setup_listener_for_payments();

      this.$payment_modes.on("click", ".shortcut", function () {
        const value = $(this).attr("data-value");
        me.selected_mode.set_value(value);
      });

      this.$component.on("click", ".submit-order-btn", () => {
        const doc = this.events.get_frm().doc;
        const paid_amount = doc.paid_amount;
        const items = doc.items;
        const customer = doc.customer;
        if (!customer) {
          frappe.show_alert({
            message: __("You must choose a customer to complete the order."),
            indicator: "orange",
          });
          frappe.utils.play_sound("error");
          return;
        }
        if (paid_amount == 0 || !items.length) {
          const message = items.length
            ? __("You cannot submit the order without payment.")
            : __("You cannot submit empty order.");
          frappe.show_alert({ message, indicator: "orange" });
          frappe.utils.play_sound("error");
          return;
        }

        this.events.submit_invoice();
      });

      frappe.ui.form.on("POS Invoice", "paid_amount", (frm) => {
        this.update_totals_section(frm.doc);

        // need to re calculate cash shortcuts after discount is applied
        const is_cash_shortcuts_invisible = !this.$payment_modes
          .find(".cash-shortcuts")
          .is(":visible");
        this.attach_cash_shortcuts(frm.doc);
        !is_cash_shortcuts_invisible &&
          this.$payment_modes.find(".cash-shortcuts").css("display", "grid");
        this.render_payment_mode_dom();
      });

      frappe.ui.form.on("POS Invoice", "loyalty_amount", (frm) => {
        const formatted_currency = format_currency(
          frm.doc.loyalty_amount,
          frm.doc.currency
        );
        this.$payment_modes
          .find(`.loyalty-amount-amount`)
          .html(formatted_currency);
      });

      frappe.ui.form.on("Sales Invoice Payment", "amount", (frm, cdt, cdn) => {
        // for setting correct amount after loyalty points are redeemed
        const default_mop = locals[cdt][cdn];
        const mode = default_mop.mode_of_payment
          .replace(/ +/g, "_")
          .toLowerCase();
        if (
          this[`${mode}_control`] &&
          this[`${mode}_control`].get_value() != default_mop.amount
        ) {
          this[`${mode}_control`].set_value(default_mop.amount);
        }
      });
    };
  } else {
    setTimeout(overridePOSCustomerSelector, 100);
  }
}
overridePOSCustomerSelector();
