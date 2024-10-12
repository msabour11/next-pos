def on_submit(doc, method):
    print("from on submit")
    # Check the outstanding amount to determine custom status2
    if doc.status == "Consolidated":
        # Update custom status based on outstanding amount
        doc.custom_status2 = "Paid Consolidated" if doc.outstanding_amount == 0 else "Unpaid Consolidated"
    else:
        # Regular POS Invoice status handling
        if doc.outstanding_amount == 0:
            doc.status = "Paid"
        else:
            doc.custom_status2 = doc.status

    # Save changes to the document
    doc.flags.ignore_permissions = True
    doc.flags.ignore_validate_update_after_submit = True

    # Save and commit the document
    doc.save(ignore_permissions=True)
    frappe.db.commit()
