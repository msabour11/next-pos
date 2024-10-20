frappe.ui.form.on("POS Invoice", {
  // on_submit(frm) {
  //   frappe.call({
  //     method: "pos.pos_api.change_status",
  //     args: {
  //       doc_name: frm.doc.name,
  //     },
  //     callback: function (r) {
  //       console.log(r.message, "frm.doc.custom_status2", frm.doc.company);
  //     },
  //   });
  // },


});

frappe.ui.form.on("POS Closing Entry", {
  on_submit(frm) {
    frappe.call({
      method: "pos.pos_api.change_consalidate_status",
      args: {
        close_name: frm.doc.name,
      },
      callback: function (r) {
        console.log(r.message);
      },
    });
  },
});
