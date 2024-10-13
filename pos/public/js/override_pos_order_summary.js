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

      this.$summary_container.on("click", ".pay-btn", async () => {
        const doc = this.events.get_frm().doc;
        const pos_profile = doc.pos_profile;
        // const cus_account = await this.get_customer_account(pos_profile);
        const cus_account = await this.get_customer_account_from_api(
          this.doc.company,
          this.doc.customer
        );
        const paid_to = await this.get_account_to(pos_profile);

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

        console.log("the data is", doc);

        console.log(this.doc);
        frappe.call({
          method: "pos.pos_api.pos_postpaid",
          args: {
            name: this.doc.name,
            paid_amount: newFieldValue,
            customer: this.doc.customer,
            reference_name: this.doc.consolidated_invoice,
            customer_account: cus_account,
            paid_to: paid_to,
          },
          callback: function (r) {
            if (!r.exc) {
              // console.log("the customer account is$", r.message);
              console.log(`the customer account is${typeof r.message}`);
              frappe.show_alert({
                message: "Amount is Successfully Paid",
                indicator: "green",
              });
            } else {
              frappe, msgprint("cannot handle the customer", this.doc.customer);
            }
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

    erpnext.PointOfSale.PastOrderSummary.prototype.get_customer_account =
      function (pos_profile) {
        return new Promise((resolve, reject) => {
          frappe.call({
            method:
              "erpnext.selling.page.point_of_sale.point_of_sale.get_pos_profile_data",
            args: { pos_profile: pos_profile },
            callback: (res) => {
              if (res.message) {
                const customer_account = res.message.custom_customer_account;
                console.log("customer account", customer_account);
                resolve(customer_account); // Resolve the promise with the profile data
              } else {
                reject("No profile data returned");
              }
            },
            error: (err) => {
              console.error("Error fetching profile data:", err);
              reject(err); // Reject the promise on error
            },
          });
        });
      };

    ////////////////////////////
    erpnext.PointOfSale.PastOrderSummary.prototype.get_customer_account_from_api =
      function (company, customer) {
        return new Promise((resolve, reject) => {
          frappe.call({
            method: "pos.pos_api.get_accounts_details",
            args: { company: company, customer: customer },
            callback: (res) => {
              if (res.message) {
                const customer_account = res.message;
                console.log("customer account", customer_account);
                resolve(customer_account); // Resolve the promise with the profile data
              } else {
                reject("No profile data returned");
              }
            },
            error: (err) => {
              console.error("Error fetching profile data:", err);
              reject(err); // Reject the promise on error
            },
          });
        });
      };

    // account to

    erpnext.PointOfSale.PastOrderSummary.prototype.get_account_to = function (
      pos_profile
    ) {
      return new Promise((resolve, reject) => {
        frappe.call({
          method:
            "erpnext.selling.page.point_of_sale.point_of_sale.get_pos_profile_data",
          args: { pos_profile: pos_profile },
          callback: (res) => {
            if (res.message) {
              const customer_account_to = res.message.custom_paid_to;
              console.log("customer account", customer_account_to);
              resolve(customer_account_to); // Resolve the promise with the profile data
            } else {
              reject("No account to  data returned");
            }
          },
          error: (err) => {
            console.error("Error fetching profile data:", err);
            reject(err); // Reject the promise on error
          },
        });
      });
    };

    erpnext.PointOfSale.PastOrderSummary.prototype.get_condition_btn_map =
      function (after_submission) {
        if (after_submission)
          return [
            {
              condition: true,
              visible_btns: ["Print Receipt", "Email Receipt", "New Order"],
            },
          ];

        return [
          {
            condition: this.doc.docstatus === 0,
            visible_btns: ["Edit Order", "Delete Order"],
          },
          {
            condition: !this.doc.is_return && this.doc.docstatus === 1,
            visible_btns: ["Print Receipt", "Email Receipt", "Return", "Pay"],
          },
          {
            condition: this.doc.is_return && this.doc.docstatus === 1,
            visible_btns: ["Print Receipt", "Email Receipt"],
          },
        ];
      };
  } else {
    setTimeout(overridePastOrderSummary, 100);
  }
}
overridePastOrderSummary();
