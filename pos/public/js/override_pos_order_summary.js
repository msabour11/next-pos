function overridePastOrderSummary() {
  if (
    typeof erpnext !== "undefined" &&
    typeof erpnext.PointOfSale !== "undefined" &&
    typeof erpnext.PointOfSale.PastOrderSummary !== "undefined"
  ) {
    erpnext.PointOfSale.PastOrderSummary.prototype.bind_events = function () {
      // Define the new field HTML
      const newFieldHtml = `
        <div class="new-field-container"  style="margin-bottom: 15px;">
            <label for="new-field">${__("Payment")}</label>
            <input type="int" id="new-field" class="form-control" placeholder="${__(
              "Enter value"
            )}">
        </div>
    `;

      // Append the new field HTML above the buttons
      this.$summary_container.find(".summary-btns").before(newFieldHtml);

      this.$summary_container.on("click", ".return-btn", () => {
        this.events.process_return(this.doc.name);
        this.toggle_component(false);
        this.$component.find(".no-summary-placeholder").css("display", "flex");
        this.$summary_wrapper.css("display", "none");
      });

      this.$summary_container.on("click", ".edit-btn", () => {
        this.events.edit_order(this.doc.name);
        this.toggle_component(false);
        this.$component.find(".no-summary-placeholder").css("display", "flex");
        this.$summary_wrapper.css("display", "none");
      });
      /////////////

      this.$summary_container.on("click", ".pay-btn", () => {
        let newFieldValue = this.$summary_container.find("#new-field").val();

        const parsedValue = parseFloat(newFieldValue);

        // Check if the parsed value is a valid number
        if (isNaN(parsedValue)) {
          frappe.show_alert({
            message: "Please enter a valid number",
            indicator: "red",
          });
          this.$summary_container.find("#new-field").val("");
          return;
        } else if (parsedValue > this.doc.outstanding_amount) {
          frappe.show_alert({
            message: "Paid amount is greater than outstanding amount",
            indicator: "red",
          });
          return;
        }

        console.log(this.doc);
        frappe.call({
          method: "pos.pos_api.pos_postpaid",
          args: {
            name: this.doc.name,
            paid_amount: newFieldValue,
            customer: this.doc.customer,
            reference_name: this.doc.consolidated_invoice,
          },
          callback: function (r) {
            if (!r.exc) {
              frappe.show_alert({
                message: "Amount is Successfully Paid",
                indicator: "green",
              });
            }
            console.log(r.message);
          },
        });

        this.toggle_component(false);
        this.$component.find(".no-summary-placeholder").css("display", "flex");
        this.$summary_wrapper.css("display", "none");
      });
      /////

      // const newFieldHtml = `
      // 	<div class="new-field-container">
      // 		<label for="new-field">${__("Payment")}</label>
      // 		<input type="int" id="new-field" class="form-control" placeholder="${__("Enter value")}">
      // 	</div>
      // 				`;

      // this.$summary_container.append(newFieldHtml);

      this.$summary_container.on("click", ".delete-btn", () => {
        this.events.delete_order(this.doc.name);
        this.show_summary_placeholder();
      });

      this.$summary_container.on("click", ".delete-btn", () => {
        this.events.delete_order(this.doc.name);
        this.show_summary_placeholder();
        // this.toggle_component(false);
        // this.$component.find('.no-summary-placeholder').removeClass('d-none');
        // this.$summary_wrapper.addClass('d-none');
      });

      this.$summary_container.on("click", ".new-btn", () => {
        this.events.new_order();
        this.toggle_component(false);
        this.$component.find(".no-summary-placeholder").css("display", "flex");
        this.$summary_wrapper.css("display", "none");
      });

      this.$summary_container.on("click", ".email-btn", () => {
        this.email_dialog.fields_dict.email_id.set_value(this.customer_email);
        this.email_dialog.show();
      });

      this.$summary_container.on("click", ".print-btn", () => {
        this.print_receipt();
      });
    };
  } else {
    setTimeout(overridePastOrderSummary, 100);
  }
}
overridePastOrderSummary();
