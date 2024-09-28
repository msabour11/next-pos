function overridePOSController() {
  if (
    typeof erpnext !== "undefined" &&
    typeof erpnext.PointOfSale !== "undefined" &&
    typeof erpnext.PointOfSale.Controller !== "undefined"
  ) {
    erpnext.PointOfSale.Controller.prototype.get_available_stock = function (
      item_code,
      warehouse
    ) {
      console.log("hi from override controller");
      frappe.msgprint("hi from controller")
      const me = this;
      return frappe.call({
        // method: "erpnext.accounts.doctype.pos_invoice.pos_invoice.get_stock_availability",
        method: "pos.pos_api.get_stock_availability",

        args: {
          item_code: item_code,
          warehouse: warehouse,
        },
        callback(res) {
          if (!me.item_stock_map[item_code]) me.item_stock_map[item_code] = {};
          me.item_stock_map[item_code][warehouse] = res.message;
        },
      });
    };
  } else {
    setTimeout(overridePOSController, 100);
  }
}
overridePOSController();
