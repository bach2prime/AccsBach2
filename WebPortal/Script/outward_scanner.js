//String Prototype
var micrRegex = {
    weak: /\s*\S(\S{7})\S\s*(\S{9})?\S?\s*(\S{13})\S\s*(\S{2})\s*(\S(\S{12})\S)?\s*/,
    'strict': /^\s*<(\d{7})<\s*(\d{9}):\s*(\d{13})<\s*(\d{2})\s*(\s*;\s*(\d{12})\s*;\s*)?\s*$/,
    'strict2': /^[\s<]+(\d{7})[\s<]+(\d{9})?[\s:]+(\d{13})[\s<]+(\d{2})\s*([\s;]+(\d{12})[\s;]+)?$/,
    'anyCharGroup': /^\s*<(.+?)<\s*(.+?):\s*(.+?)<\s*(.+?)\s*(;(.+?);)?/,
    'digitGroup': /^[^\d]+(\d+)[^\d]+(\d+)[^\d]+(\d+)[^\d]+(\d+)([^\d]+(\d+))?/
};

//indicates the instrument type
var WS_InstrumentType = {
    DepositSlip: 0,
    Cheque: 1,
    ReScanCheque: 2,
    RepresentCheque: 3
};

var WS_OutwardServiceResponseResult = {
    success: 0,
    fail: 1
};

//Scanner Mode.
var ScanModeEnum = {
    Batch: 0,
    Single: 1,
    DepositSlipBatch: 2,
    DepositSlipSingle: 3,
    ReScanBatch: 4,
    ReScanSingle: 5,
    RepresentBatch: 6
};

function IsValidPresentingDate() {

    var batchDateStr = $("#cu_date").val();
    var permittedForwardDate = new Date();
    
    permittedForwardDate.addDays(futureBusinessDaysAllowed);
    var batchDate = new Date();
    
    if (batchDateStr != '')

        batchDate = getValidDate(batchDateStr, "dd/mm/yyyy", "dd/mm/yy");
    return batchDate < permittedForwardDate;


}
function WS_IQA() {
    this.partial_image = 0;
    this.excessive_image_skew = 0;
    this.piggyback_image = 0;
    this.too_light_or_too_dark = 0; 
    this.streaksandor_bands = 0;
    this.below_min_image_size = 0;
    this.exceeds_max_image_size = 0;
    this.image_enabled_pod = 0;
    this.source_doc_bad = 0;
    this.date_usability = 0;
    this.payee_usability = 0;
    this.con_amt_usability = 0;
    this.leg_amt_usability = 0;
    this.signature_usability = 0;
    this.payer_details_usability = 0;
    this.micr_line_usability = 0;
    this.memo_line_usability = 0;
    this.payer_bank_details_usability = 0;
    this.payee_endorsement_usability = 0;
    this.presenting_bank_endorse_usability = 0;
    this.transit_endorse_usability = 0;
    this.usr_fld = "";
}

function CheckSize(_size) {
    var x = _size / 256.0;
    var y = _size % 256;

    this.y = (y + 0.5) / 10.0;
    this.x = (x + 0.5) / 10.0;
}

function MICR(_micr, _ocr, _quality) {
    this.quality = _quality;
    this.micr = _micr.replace("E", "");
    this.ocr = _ocr;
}

function CheckImage(_iamge, _length) {
    this.image = _image;
    this.length = _length;
}

function ScannedCheck(_micr, _front, _back, _iqa) {
    this.iqa = _iqa;
    this.front = _front;
    this.rear = _back;
    this.micr = _micr;
    this.amount = 0;
    this.account = 0;
    this.payee = "";
    this.date = "";
    this.status;
    this.type = Accs.OutwardWebServiceObject.WS_InstrumentType.Cheque;
}


function micr_validate(input, length) {
    if (length == 7) {
        var text = $(input).val();
        if (isValidSerial(text)) {
            $(input).removeClass("micr_error");
        } else {
            $(input).addClass("micr_error");
        }
    } else if (length == 9) {
        var text = $(input).val();
        if (isValidRouting(text)) {
            if (checkValidRouting(text)) {
                $(input).removeClass("micr_error");
            }
            else {
                $(input).addClass("micr_error");
            }
        } else {
            $(input).addClass("micr_error");
        }
    } else if (length == 13) {
        var text = $(input).val();
        if (isValidAccount(text)) {
            $(input).removeClass("micr_error");
        } else {
            $(input).addClass("micr_error");
        }
    } else if (length == 2) {
        var text = $(input).val();
        if (isValidTransactionType(text)) {
            $(input).removeClass("micr_error");
        } else {
            $(input).addClass("micr_error");
        }
    }
}


window.onload = function () {


    $("#ddlCurrencyType").change(function() {
        var selectedValue = this.value;
        var clearingTypeSelectionVal = selectedValue != 0 ? 1 : 0;
        $("#clearing_type").val(clearingTypeSelectionVal);

        


    });

    var DOM =
    {
        COM:
        {
            Scanner:null,
            FrontImage: document.getElementById("frontimage"),
            RearImage: document.getElementById("backimage"),
            FrontPreview: document.getElementById("popupFrontImage"),
            RearPreview: document.getElementById("popupBackImage")
        },
        Cheque:
        {
            Endorsement: $("#endorsement_print"),
            ClearingType: $("#clearing_type")
        },
        Dialog:
        {
            PopupImage: $('#dialogPopupImage'),
            Popup: $('#dialog'),
            ScanningImagesView: $('#divScanningImagesView'),
            DatabaseUpdating: $("#divDatabaseUpdating"),
            VoucherModal: $("#divVoucherModal"),
            Overlay: $("#modal-overlay")
        },
        DIV:
        {
            PreInsert: $('#divPreInsertTable'),
            PostInsert: $('#divPostInsertTable'),
            ScannerController: $('#divScannerController'),
            ScanCount: $("#spanNoChequeScanned")
        },
        Table:
        {
            PostInsert: $('#tablePostInsert'),
            PreInsert: $('#tablePreInsert')
        }
    };

    var isScannerReady = false;
    var _clrType = "";
    var _representmentCount = "";
    /***********************************************************/

    //Global Variables//
    var _curObj;
    var _curId;

    var _frontImg;
    var _rearImg;

    var _scanMode;
    var _useOcr;

    var _scannedDocs;
    var _scanIndex = 0;
    var _dbResponse;

    var _itemSequenceNo = -1;
    var _presenting_routing = "";
    var _serverDate = "";
    var _endosement_enabled = true;
    var _endorsement_line = 1;
    var _isCanon = false;
    var _isPanini = false;
    var _voucherShow = true;

    /***********************************************************/

    //UTILITY FUNCTIONS//////////////////
    function zeroPad(num, count) {
        var numZeropad = num + '';
        while (numZeropad.length < count) {
            numZeropad = "0" + numZeropad;
        }
        return numZeropad;
    }

    function GenerateDIN(routing, itemseq, ddmmyy) {
        var din = routing + " " + zeroPad(itemseq, 8) + " " + ddmmyy;
        return din;
    }

    function getBofdId() {
        var bofd_id = $($(".ddBranchList")[0]).val() | 0;
        return bofd_id;
    }

    function validateMICRData(micr) {
        if (micr.match(micrRegex.strict2) !== null)
            return "MICR Format Recognized";
        else
            return "Unrecognized MICR Format";
    }
    function PreprocessScanning(mode) {

        //Setup the global variable _endosement_enabled which decides whether the endorsement will be print.


        _endosement_enabled = DOM.Cheque.Endorsement.is(':checked');

        //alert(_endosement_enabled);
        //if (DOM.Cheque.Endorsement.is(':checked')) {
        //    _endosement_enabled = true;
        //}
        //else {
        //    _endosement_enabled = false;
        //}
        _endorsement_line = $("input[name=endorsement_line]:radio").filter(':checked').val() | 0;

        //Reset Scanning Data
        _scanMode = mode;
        _scannedDocs = new Array();
        _scanIndex = 0;
        _dbResponse = new Array();
        DOM.DIV.ScanCount.text("");

        //Show Modal Scanning Dialog....
        DOM.Dialog.Overlay.show();
        DOM.Dialog.ScanningImagesView.show();
        DOM.DIV.PreInsert.hide();
        DOM.DIV.PostInsert.hide();

        //Clear all image views.
        DOM.COM.FrontPreview.Clear();
        DOM.COM.RearPreview.Clear();
        DOM.COM.FrontImage.Clear();
        DOM.COM.RearImage.Clear();

        if (_isCanon || _isPanini) {
            ProcessFixedEndorsement();
        }
    }
    /////////////////////////////////////

    //COM INTERACTION////////////////////
    // Get DeviceLib object
    function GetScannerCom() {
        if (DOM.COM.Scanner == null) {
            DOM.COM.Scanner = document.getElementById("COM123");
            DOM.COM.Scanner.attachEvent('OnScanComplete', fOnScanComplete);
            DOM.COM.Scanner.attachEvent('OnBatchComplete', fOnBatchComplete);
            DOM.COM.Scanner.attachEvent('OnUpstreamScanComplete', fOnUpstreamScanComplete);
            DOM.COM.Scanner.attachEvent('OnScannerReady', fOnScannerReady);
            DOM.COM.Scanner.attachEvent('OnScannerError', fOnScannerError);
            DOM.COM.Scanner.attachEvent('OnShutDownComplete', fOnShutDownComplete);

        }
        return DOM.COM.Scanner;
    }

    // Load the specified images
    function LoadCheckImages(frontImage, backImage) {
        DOM.COM.FrontImage.LoadFile(frontImage, 1);
        DOM.COM.RearImage.LoadFile(backImage, 1);
    }

    //Creates the Endorsement.
    function CreateDINEndorsement(endorsement) {

        if (isValidDIN(endorsement)) {

            DOM.COM.Scanner.SetEndorsementLine(_endorsement_line);

            if (_endosement_enabled) {
                DOM.COM.Scanner.SetEndorsement(true);
                DOM.COM.Scanner.SetEndorsementString(endorsement);
                
            }
            else {
                //alert("Endorsement not enabled");
                DOM.COM.Scanner.SetEndorsement(false);
                //DOM.COM.Scanner.SetEndorsementString(endorsement);
                
                
            }

            //This function is obsolete for Ranger. Used for DCC
            DOM.COM.Scanner.CreateEndorsementBitmap();

            return true;
        }
        else {
            //Do not endorse.
            DOM.COM.Scanner.SetEndorsement(false);
            DOM.COM.Scanner.SetEndorsementString("");

            alert("Problem in DIN.");
            return false;
        }
    }
    /////////////////////////////////////

    // Scans a batch of checks
    function ScanBatch() {
        if (isScannerReady == false) {
            alert("Scanner is not ready!");
            //return;
        }


        _clrType = DOM.Cheque.ClearingType.val();
        if (_clrType == "0") {
            alert("Please Select Clearing Type");
            return;
        }

        if (!IsValidPresentingDate()) {
            return;
        }




        var bodf_id = getBofdId();
        Accs.Web.Outward.OutwardService.GetItemSequenceNo(bodf_id,
        function (ws_rsp) {
            try {
                _itemSequenceNo = ws_rsp.data.itemseq;
                _presenting_routing = ws_rsp.data.routing;
                _serverDate = ws_rsp.data.date;

                if (_itemSequenceNo < -1) {
                    alert("Item Sequence no not found!");
                    return;
                }

                PreprocessScanning(ScanModeEnum.Batch);
                DOM.COM.Scanner.ScanBatch(_itemSequenceNo);
            }
            catch (e) {
                alert("Error: 273\nProblem in ScanBatch.\n" + e.description);
                ResetPage();
                return;
            }
        },
        function (err) {
            alert("Error: 279\nNetwork Problem.\n" + err);
        });
    }

    function ReScanBatch() {
        if (isScannerReady == false) {
            alert("Scanner is not ready!");
            return;
        }

        _clrType = DOM.Cheque.ClearingType.val();
        if (_clrType == "0") {
            alert("Please Select Clearing Type");
            return;
        }
        if (!IsValidPresentingDate()) {
            return;
        }

        //        _representmentCount = $("#select_representment").val();
        //        if (_representmentCount == "") {
        //            alert("Please Select Representment Count");
        //            return;
        //        }

        var bodf_id = getBofdId();
        Accs.Web.Outward.OutwardService.GetItemSequenceNo(bodf_id,
        function (ws_rsp) {
            try {
                _itemSequenceNo = ws_rsp.data.itemseq;
                _presenting_routing = ws_rsp.data.routing;
                _serverDate = ws_rsp.data.date;

                if (_itemSequenceNo < -1) {
                    alert("Item Sequence no not found!");
                    return;
                }

                PreprocessScanning(ScanModeEnum.ReScanBatch);
                DOM.COM.Scanner.ScanBatch(_itemSequenceNo);
            }
            catch (e) {
                alert("Error: 951\nProblem in ReScanBatch.\n" + e.description);
                ResetPage();
                return;
            }
        },
        function (err) {
            alert("Error:992\nNetwork Problem.\n" + err);
        });
    }

    function RepresentBatch() {
        if (isScannerReady == false) {
            alert("Scanner is not ready!");
            return;
        }

        _clrType = DOM.Cheque.ClearingType.val();
        if (_clrType == "0") {
            alert("Please Select Clearing Type");
            return;
        }

        //        _representmentCount = $("#select_representment").val();
        //        if (_representmentCount == "") {
        //            alert("Please Select Representment Count");
        //            return;
        //        }
        if (!IsValidPresentingDate()) {
            return;
        }

        var bodf_id = getBofdId();
        Accs.Web.Outward.OutwardService.GetItemSequenceNo(bodf_id,
        function (ws_rsp) {
            try {
                _itemSequenceNo = ws_rsp.data.itemseq;
                _presenting_routing = ws_rsp.data.routing;
                _serverDate = ws_rsp.data.date;

                if (_itemSequenceNo < -1) {
                    alert("Item Sequence no not found!");
                    return;
                }

                //Scan mode is Represent Batch
                PreprocessScanning(ScanModeEnum.RepresentBatch);
                //Disable Endorsement.
                DOM.COM.Scanner.SetEndorsement(false);

                DOM.COM.Scanner.ScanBatch(_itemSequenceNo);
            }
            catch (e) {
                alert("Error: 951\nProblem in RepresentBatch.\n" + e.description);
                ResetPage();
                return;
            }
        },
        function (err) {
            alert("Error:992\nNetwork Problem.\n" + err);
        });
    }


    //SCANNER EVENTS/////////////////////////////
    //Batch Completed
    function fOnBatchComplete(num) {
        // Load the last image
        if (num > 0) {
            alert(num + " cheques were scanned.");

            //Close Modal Scanning Dialog....
            DOM.Dialog.Overlay.hide();
            DOM.Dialog.ScanningImagesView.hide();
            DOM.DIV.PreInsert.show();
            DOM.DIV.ScannerController.hide();


            if (_scanMode == ScanModeEnum.RepresentBatch || _scanMode == ScanModeEnum.ReScanBatch) {
                createPreInsertTableEditable(_scannedDocs);
            }
            else {
                createPreInsertTable(_scannedDocs);
            }
            EnableScanButtons();
        }
        else {
            alert("No checks scanned.");
            //Reset Settings...
            ResetPage();
            return;
        }
    }

    //Used to print endorsement
    function fOnUpstreamScanComplete() {
        if (!_isCanon || _isPanini) {
            //alert("UpStream Complete");
            var din = GenerateDIN(_presenting_routing, _itemSequenceNo, _serverDate);

            CreateDINEndorsement(din);

            _itemSequenceNo++;
        }
    }

    //To get the images...
    function fOnScanComplete(jsonScanRes) {
        _scanIndex++;

        DOM.DIV.ScanCount.text(_scanIndex);

        var __cheque = eval("(" + jsonScanRes + ")");
        var imgFront;
        var imgRear;
        try {
            imgFront = __cheque.img.front.replace(/\//gi, "\\");
            imgRear = __cheque.img.rear.replace(/\//gi, "\\");
            

            LoadCheckImages(imgFront, imgRear);

            //Important. Calling the webservice. So can not send image files. instead send the Base64 encoded string.
            __cheque.front = DOM.COM.Scanner.GetBase64Tiff(imgFront);
            __cheque.rear = DOM.COM.Scanner.GetBase64Tiff(imgRear);

            //if (_scanMode == ScanModeEnum.Batch || _scanMode == ScanModeEnum.DepositSlipBatch || _scanMode == ScanModeEnum.ReScanBatch || _scanMode == ScanModeEnum.RepresentBatch) {
            __cheque.date = "";
            __cheque.amount = 0;
            __cheque.payee = "";
            __cheque.account = "";
            __cheque.selected = true;

            _scannedDocs.push(__cheque);
            //}
            //            else if (_scanMode == ScanModeEnum.Single) {
            //                __cheque.date = "";
            //                __cheque.amount = 0;
            //                __cheque.payee = "";
            //                __cheque.account = "";
            //                __cheque.selected = true;

            //                _scannedDocs.push(__cheque);
            //}
        }
        catch (err) {
            alert("Error: 356:\nScanner Event Problem.\n" + err);
        }
    }

    //Scanner Errors
    function fOnScannerError(err) {
        alert("Error: 362:\nScanner Problem: \n" + err);
    }

    function ProcessFixedEndorsement() {
        if (_isCanon || _isPanini) {
            var din = GenerateDIN(_presenting_routing, _itemSequenceNo, _serverDate);
            CreateDINEndorsement(din);
            if (_isPanini) {

                _itemSequenceNo++;
            }
        }
    }

    //Scanner is ready to process
    function fOnScannerReady() {
        EnableScanButtons();
        isScannerReady = true;
        alert("Scanner is ready!");

        _isCanon = DOM.COM.Scanner.IsCanon();
        _isPanini = DOM.COM.Scanner.IsPanini();

    }

    function fOnShutDownComplete() {

        alert("Scanner Resource Released.");
        DisableScanButtons();
        isScannerReady = false;
        //DOM.COM.Scanner.Dispose();
        //alert("Scanner Shut down successfully.");

    }
    function fOnShutDownCompletenew(num) {

        alert(2);
        DisableScanButtons();
        isScannerReady = false;
        //alert("Scanner Shut down successfully.");

    }
    /////////////////////////////////////////////    

    // Eject any documents
    function EjectDocument() {
        if (isScannerReady == false) {
            alert("Scanner is not ready!");
            return;
        }
        DOM.COM.Scanner.Eject();
    }

    function ResetPage() {
        DOM.DIV.PostInsert.hide();
        DOM.DIV.PreInsert.hide();
        DOM.Dialog.Overlay.hide();
        DOM.Dialog.ScanningImagesView.hide();
        DOM.Dialog.DatabaseUpdating.hide();

        DOM.DIV.ScannerController.show();
    }

    // Cancel batch scan
    function CancelBatch() {
        if (isScannerReady == false) {
            alert("Scanner is not ready!");
            return;
        }
        DOM.COM.Scanner.CancelBatch();
    }

    function DisableScanButtons() {
        //document.getElementById("eventdata").value = "";
        //document.getElementById("scansingletiff").disabled = true;
        //document.getElementById("scansinglejpeg").disabled = true;
        //document.getElementById("scansingleboth").disabled = true;
        document.getElementById("btStartScan").disabled = false;
        document.getElementById("scan_batch_tiff").disabled = true;
        document.getElementById("rescan_batch_tiff").disabled = true;
        try { document.getElementById("representment_batch").disabled = true; } catch (err) { }
        document.getElementById("btStopScan").disabled = true;
        //document.getElementById("scan_deposit_slip").disabled = true;
        //document.getElementById("scanbatchjpeg").disabled = true;
        //document.getElementById("scanbatchboth").disabled = true;
        document.getElementById("Eject").disabled = true;

        DOM.DIV.PreInsert.hide();
    }

    function EnableScanButtons() {
        //document.getElementById("scansingletiff").disabled = false;
        //document.getElementById("scansinglejpeg").disabled = false;
        //document.getElementById("scansingleboth").disabled = false;
        try {
            document.getElementById("btStartScan").disabled = true;
            document.getElementById("scan_batch_tiff").disabled = false;
            document.getElementById("rescan_batch_tiff").disabled = false;
            try {
                document.getElementById("representment_batch").disabled = false;
            } catch (err) {
            }
            document.getElementById("btStopScan").disabled = false;
            //document.getElementById("scan_deposit_slip").disabled = false;
            //document.getElementById("scanbatchjpeg").disabled = false;
            //document.getElementById("scanbatchboth").disabled = false;
            document.getElementById("Eject").disabled = false;
        } catch (err) {
        }
    }


    function postOCEWebRequestBatch() {
        try {
            var bofd_id = getBofdId();
            var currencyType = $("#ddlCurrencyType").val();
            var _batchDate = $($(".cu_date_scan")[0]).attr("value");

            DOM.Dialog.Overlay.show();
            DOM.Dialog.DatabaseUpdating.show();

            Accs.Web.Outward.OutwardService.InsertCheques(
            //Parameters
                _scannedDocs, bofd_id, _clrType, _batchDate,currencyType,
            //Success
                function (ws_rsp) {
                    DOM.DIV.PreInsert.hide();
                    DOM.DIV.PostInsert.show();
                    createPostInsertTable(ws_rsp);

                    DOM.Dialog.Overlay.hide();
                    DOM.Dialog.DatabaseUpdating.hide();
                },
            //Error
                function (e) {
                    DOM.Dialog.Overlay.hide();
                    DOM.Dialog.DatabaseUpdating.hide();
                    alert("Error:465:\nNetwork Problem. Try Again!\n" + e);
                    //ResetPage();//Defer Reset Page!.
                }
                );
        }
        catch (err) {
            alert("Error:471:\nError Saving Cheques.\n" + err);
            return false;
        }
    }

    function sortTable() {
        DOM.Table.PreInsert.tablesorter({
            debug: false,
            sortList: [[0, 0]],
            widgets: ['zebra']
        })
        .tablesorterPager({
            container: $("#pagerPreInsert"),
            positionFixed: false
        });
    }


    function createPreInsertTable(cheques) {
        try {

            if (cheques != null && cheques.length > 0) {

                var table_scanned = DOM.Table.PreInsert;

                $('tbody', table_scanned).remove();
                var table_body = table_scanned.append('<tbody></tbody>');

                // Number of td's in the last table row
                var n = cheques.length;
                var tds = '';
                var micr;
                var tdClass = "";
                for (var i = 0; i < n; i++) {

                    tds += '<tr>';

                    if (i % 2) {
                        tdClass = "alt";
                    }
                    else {
                        tdClass = "";
                    }

                    //Cheque Selection Checkbox
                    tds += "<th class='spec" + tdClass + "'><input type='checkbox' class='cheque_select' id='chi_" + i + "' checked='checked' /></th>";

                    //MICR
                    if (cheques[i].micr.quality > 5) {
                        micr = cheques[i].micr.micr;
                    }
                    else if (_useOcr == "yes") {
                        micr = cheques[i].micr.ocr;
                    }
                    else {
                        micr = "Unrecognized MICR";
                    }
                    tds += '<td class="' + tdClass + '">' + micr + '</td>';

                    //MICR Validation
                    var valid = validateMICRData(micr);
                    tds += '<td class="' + tdClass + '">' + valid + '</td>';

                    //Popup Image Link
                    tds += '<td class="' + tdClass + '">' + '<a title="' + i + '" href="#" class="scanned_img">Show Images</a>' + '</td>';

                    //MICR Quality
                    if (cheques[i].micr.quality > 5)
                        tds += '<td class="' + tdClass + '">' + 'Good MICR' + '</td>';
                    else if (_useOcr == "yes")
                        tds += '<td class="' + tdClass + '">' + 'OCR Used' + '</td>';
                    else
                        tds += '<td class="' + tdClass + '">' + 'Not Valid MICR' + '</td>';


                    //IQA Details, to be added...
                    //tds += '<td class="' + tdClass + '">' + '</td>';

                    tds += '</tr>';
                }

                $("#preInsertSummary").text("Total " + n + " cheques.");

                table_body.append(tds);

                $(".scanned_img").click(function (evt) {
                    popupScanImage(evt);
                    return false;
                });

                $(".cheque_select").click(function (evt) {
                    var m = this.id.match(/chi_(\d+)/);
                    var index = m[1];
                    cheques[index].selected = this.checked;
                });
            }
            else {
                alert("PreInsert: No Cheques to show.");
                DOM.DIV.ScannerController.show();
                DOM.DIV.PreInsert.hide();
            }
        } catch (e) {
            alert("Error:570:\nProblem Creating Pre-Insert Cheque Table.\n" + e);
            ResetPage();
            return;
        }
    }



    function createPreInsertTableEditable(cheques) {
        try {

            if (cheques != null && cheques.length > 0) {

                var table_scanned = DOM.Table.PreInsert;

                $('tbody', table_scanned).remove();
                var table_body = table_scanned.append('<tbody></tbody>');

                // Number of td's in the last table row
                var n = cheques.length;
                var tds = '';
                var micr;
                var tdClass = "";
                for (var i = 0; i < n; i++) {

                    tds += '<tr>';

                    if (i % 2) {
                        tdClass = "alt";
                    }
                    else {
                        tdClass = "";
                    }

                    //Cheque Selection Checkbox
                    tds += "<th class='spec" + tdClass + "'><input type='checkbox' class='cheque_select' id='chi_" + i + "' checked='checked' /></th>";

                    //MICR
                    if (cheques[i].micr.quality > 5) {
                        micr = cheques[i].micr.micr;
                    }
                    else if (_useOcr == "yes") {
                        micr = cheques[i].micr.ocr;
                    }
                    else {
                        micr = "Unrecognized MICR";
                    }
                    tds += '<td class="' + tdClass + '">' + micr + '</td>';

                    //tds += '<td class="' + tdClass + '"><input type="text" ' + micr + '</td>';
                    //tds += '<td class="' + tdClass + '">' + micr + '</td>';
                    //tds += '<td class="' + tdClass + '">' + micr + '</td>';
                    //tds += '<td class="' + tdClass + '">' + micr + '</td>';

                    var micr_error = 'micr_error';

                    var micr_inputs = '';



                    var match = micrRegex.weak.exec(micr);

                    var micr_serial = "";
                    var micr_routing = "";
                    var micr_account = "";
                    var micr_tt = "";

                    if (match != null) {
                        micr_serial = match[1];
                        micr_routing = match[2];
                        micr_account = match[3];
                        micr_tt = match[4];
                    } else {
                        result = "";
                    }

                    if (isValidSerial(micr_serial)) micr_error = '';
                    else micr_error = 'micr_error';
                    micr_inputs += '<input type="text" class="i_micr micr_s w60 ' + micr_error + '" maxlength="7" value="' + micr_serial + '" onblur="micr_validate(this,7)" />';

                    if (isValidRouting(micr_routing)) micr_error = '';
                    else micr_error = 'micr_error';
                    micr_inputs += '<input type="text" class="i_micr micr_r w75 ' + micr_error + '" maxlength="9" value="' + micr_routing + '" onblur="micr_validate(this,9)" />';

                    if (isValidAccount(micr_account)) micr_error = '';
                    else micr_error = 'micr_error';
                    micr_inputs += '<input type="text" class="i_micr micr_a w110 ' + micr_error + '" maxlength="13" value="' + micr_account + '" onblur="micr_validate(this,13)" />';

                    if (isValidTransactionType(micr_tt)) micr_error = '';
                    else micr_error = 'micr_error';
                    micr_inputs += '<input type="text" class="i_micr micr_t w20 ' + micr_error + '" maxlength="2" value="' + micr_tt + '" onblur="micr_validate(this,2)" />';

                    tds += '<td class="' + tdClass + '">' + micr_inputs + '</td>';

                    //Popup Image Link
                    tds += '<td class="' + tdClass + '">' + '<a title="' + i + '" href="#" class="scanned_img">Show Images</a>' + '</td>';

                    //IQA Details, to be added...
                    //MICR Quality
                    if (cheques[i].micr.quality > 5)
                        tds += '<td class="' + tdClass + '">' + 'Good MICR' + '</td>';
                    else if (_useOcr == "yes")
                        tds += '<td class="' + tdClass + '">' + 'OCR Used' + '</td>';
                    else
                        tds += '<td class="' + tdClass + '">' + 'Bad MICR' + '</td>';

                    tds += '</tr>';
                }

                $("#preInsertSummary").text("Total " + n + " cheques.");

                table_body.append(tds);

                $(".scanned_img").click(function (evt) {
                    popupScanImage(evt);
                    return false;
                });

                $(".cheque_select").click(function (evt) {
                    var m = this.id.match(/chi_(\d+)/);
                    var index = m[1];
                    cheques[index].selected = this.checked;
                });
            }
            else {
                alert("PreInsert: No Cheques to show.");
                DOM.DIV.ScannerController.show();
                DOM.DIV.PreInsert.hide();
            }
        } catch (e) {
            alert("Error:570:\nProblem Creating Pre-Insert Cheque Table.\n" + e);
            ResetPage();
            return;
        }
    }

    function createPostInsertTable(response) {
        try {
            if (response.result == WS_OutwardServiceResponseResult.success && _scannedDocs) {
                //Store the response into _dbResponse
                _dbResponse = response.data;
                var table_scanned = DOM.Table.PostInsert;
                $('tbody', table_scanned).remove();
                var table_body = table_scanned.append('<tbody></tbody>');

                // Number of td's in the last table row
                var n = _scannedDocs.length;
                var tds = '';
                var tdClass = "";
                var micr;
                for (var i = 0; i < n; i++) {

                    tds += '<tr>';

                    if (i % 2) {
                        tdClass = "alt";
                    }
                    else {
                        tdClass = "";
                    }

                    //MICR
                    if (_scannedDocs[i].micr.quality > 5) {
                        micr = _scannedDocs[i].micr.micr;
                    }
                    else if (_useOcr == "yes") {
                        micr = _scannedDocs[i].micr.ocr;
                    }
                    else {
                        micr = "Unrecognized MICR";
                    }
                    tds += '<td class="nobold' + tdClass + '">' + micr + '</td>';

                    //MICR Validation
                    //var valid = validateMICRData(micr);
                    //tds += '<td>' + valid + '</td>';

                    //MICR Quality
                    //if (_scannedDocs[i].micr.quality > 5)
                    //    tds += '<td>' + 'Good MICR' + '</td>';
                    //else if (_useOcr == "yes")
                    //    tds += '<td>' + 'OCR Used' + '</td>';
                    //else
                    //    tds += '<td>' + 'Nor Valid MICR' + '</td>';

                    //Popup Image Link
                    tds += '<td class="' + tdClass + '">' + '<a title="' + i + '" href="#" class="scanned_img">Show Images</a>' + '</td>';

                    //DB Response//
                    if (response.data.cheques[i].status == WS_OutwardServiceResponseResult.success) {
                        tds += '<td class="' + tdClass + '">' + 'Successfully Inserted into DB' + '</td>';
                    }
                    else
                        tds += '<td class="' + tdClass + '">' + 'Error: ' + response.data.cheques[i].details + '</td>';
                    tds += '</tr>';
                }
                table_body.append(tds);
                $("#postInsertSummary").text("Total " + n + " cheques.");
                $("#batchNo").text("Batch No: " + response.data.batch_no);

                $(".scanned_img").click(function (evt) {
                    popupScanImage(evt);
                    return false;
                });
            }
            else {
                if (response.result == WS_OutwardServiceResponseResult.fail) {
                    alert("ServerResponse: \n" + response.data);
                }
                else {
                    alert("PostInsert: No Cheques to show.");
                }
                DOM.DIV.ScannerController.show();
                DOM.DIV.PostInsert.hide();
            }
        } catch (e) {
            alert("Error:570:\nProblem Creating Post-Insert Cheque Table.\n" + e);
            ResetPage();
            return;
        }
    }

    function popupScanImage(evt) {
        id = evt.target.title;

        src = _scannedDocs[id].img.front.replace(/\//gi, "\\")
        src = src.replace('file:///', '');
        src = src.replaceAll("%20", " ");
        DOM.COM.FrontPreview.LoadFile(src, 1);

        src = _scannedDocs[id].img.rear.replace(/\//gi, "\\")
        src = src.replace('file:///', '');
        src = src.replaceAll("%20", " ");
        DOM.COM.RearPreview.LoadFile(src, 1);

        DOM.Dialog.PopupImage.show();
        DOM.Dialog.PopupImage.dialog("open");
        return false;
    }


    //Button Click//
    //    $("#scansingletiff").click(function (event) {
    //        ScanSingle();
    //    });

    $("#scan_batch_tiff").click(function (event) {
        ScanBatch();
    });

    $("#btStartScan").click(function() {
        try {
            InitializeScanner();
        }
        catch (e) {
            alert("Warning:\nUnable to initialize Scanner.\nProbably The Scanner Driver is not installed or you are using a non-Internet Explorer Browser.\nPlease try in internet explorer 7+ and install the scanner drivers.");
            window.close();
        }
    });

    $("#btStopScan").click(function () {
        
        // InitializeScanner();
        ShutDownScanner();
        //DisableScanButtons();

    });



    $("#rescan_batch_tiff").click(function (event) {
        ReScanBatch();
    });

    $("#representment_batch").click(function (event) {
        RepresentBatch();
    });

    $("#Eject").click(function (event) {
        EjectDocument();
    });

    $("#insert_db").click(function (event) {
        if (_scanMode == ScanModeEnum.ReScanBatch || _scanMode == ScanModeEnum.RepresentBatch) {

            //Loop into the table and findout the editted values

            var problem = false;

            var tbody = $("tbody", DOM.Table.PreInsert);
            $('tr', tbody).each(function () {

                var vvv = $('th input', this).attr("id");
                var m = vvv.match(/chi_(\d+)/);
                var index = m[1];

                var td2 = $(this).find("td").eq(1);
                var micr_ss = $(".micr_s", td2).val();
                var micr_rr = $(".micr_r", td2).val();
                var micr_aa = $(".micr_a", td2).val();
                var micr_tt = $(".micr_t", td2).val();


                if (!isValidSerial(micr_ss)) {
                    $(".micr_s", td2).addClass("micr_error");
                    problem = true;
                }

                if (micr_rr.length > 0 && !(isValidRouting(micr_rr) && checkValidRouting(micr_rr))) {
                    $(".micr_r", td2).addClass("micr_error");
                    problem = true;
                }

                if (!isValidAccount(micr_aa)) {
                    $(".micr_a", td2).addClass("micr_error");
                    problem = true;
                }

                if (!isValidTransactionType(micr_tt)) {
                    $(".micr_t", td2).addClass("micr_error");
                    problem = true;
                }

                _scannedDocs[index].micr.micr_modified = "<" + micr_ss + "< " + micr_rr + ": " + micr_aa + "< " + micr_tt;
            });

            if (problem) {
                alert("Not all values are valid, please check.");
                return false;
            }
        }

        InsertIntoDatabase();
    });


    $('#yes').click(function () {
        $("#dialog").dialog('close');
        var li_autoValidation = getAutoValidation();
        if (li_autoValidation != "") {
            alert("Some, Required field are not present. Please Reject The Cheque.");
            return;
        }

        $('#data_entry_dialog').block({
            message: '<h1>Processing Database</h1>',
            css: {
                border: '3px solid #a00'
            }
        });

        var payee_usability = $("#payee_usability").attr('checked') ? 2 : 1;
        var date_usability = $("#date_usability").attr('checked') ? 2 : 1;
        var con_amt_usability = $("#con_amt_usability").attr('checked') ? 2 : 1;
        var signature_usability = $("#signature_usability").attr('checked') ? 2 : 1;
        var payer_details_usability = $("#payer_details_usability").attr('checked') ? 2 : 1;


        _scannedDocs[0].iqa.payee_usability = payee_usability;
        _scannedDocs[0].iqa.date_usability = date_usability;
        _scannedDocs[0].iqa.con_amt_usability = con_amt_usability;
        _scannedDocs[0].iqa.signature_usability = payee_usability;
        _scannedDocs[0].iqa.payee_usability = payer_details_usability;

        _scannedDocs[0].date = $($(".cu_date")[0]).attr("value");
        _scannedDocs[0].amount = $("#cu_amount").attr("value");
        _scannedDocs[0].account = $("#cu_account").attr("value");
        _scannedDocs[0].payee = $("#cu_payee").attr("value");
        _scannedDocs[0].status = "outward_maker_accept";

        postOCEWebRequest(0);
    });

    function getAutoValidation() {
        var li_autoValidation = "";
        if ($("#payee_usability").attr('checked') == false)
            li_autoValidation += "<li>Payee Name not present.</li>";
        if ($("#date_usability").attr('checked') == false)
            li_autoValidation += "<li>Date not present.</li>";
        if ($("#con_amt_usability").attr('checked') == false)
            li_autoValidation += "<li>Amount not specified.</li>";
        if ($("#signature_usability").attr('checked') == false)
            li_autoValidation += "<li>Signature Problem.</li>";
        if ($("#payer_details_usability").attr('checked') == false)
            li_autoValidation += "<li>Payer details not found.</li>";
        return li_autoValidation;
    }

    $('#reject').click(function () {
        $("#dialog").dialog('close');
        var li_autoValidation = getAutoValidation();

        if (li_autoValidation == "") {
            $("#auto_reject_reason").attr("class", "hidden");
            $("#auto_reject_reason").html(li_autoValidation);
        }
        else {
            $("#auto_reject_reason").attr("class", "");
            $("#auto_reject_reason").html(li_autoValidation);
        }

        $("#data_entry_dialog").block({
            message: $('#rejection_dialog'),
            css: {
                width: '260px',
                top: ($(window).height() - 400) / 2 + 'px',
                left: ($(window).width() - 260) / 2 + 'px',
                background: 'rgb(235, 244, 251)'
            }
        });
        return false;
    });

    $('#reject_confirm').click(function () {
        var payee_usability = $("#payee_usability").attr('checked') ? 2 : 1;
        var date_usability = $("#date_usability").attr('checked') ? 2 : 1;
        var con_amt_usability = $("#con_amt_usability").attr('checked') ? 2 : 1;
        var signature_usability = $("#signature_usability").attr('checked') ? 2 : 1;
        var payer_details_usability = $("#payer_details_usability").attr('checked') ? 2 : 1;

        _scannedDocs[0].iqa.payee_usability = payee_usability;
        _scannedDocs[0].iqa.date_usability = date_usability;
        _scannedDocs[0].iqa.con_amt_usability = con_amt_usability;
        _scannedDocs[0].iqa.signature_usability = payee_usability;
        _scannedDocs[0].iqa.payee_usability = payer_details_usability;

        _scannedDocs[0].date = $($(".cu_date")[0]).attr("value");
        _scannedDocs[0].amount = $("#cu_amount").attr("value");

        _scannedDocs[0].account = $("#cu_account").attr("value");
        _scannedDocs[0].payee = $("#cu_payee").attr("value");
        _scannedDocs[0].status = "outward_maker_reject";

        $('#data_entry_dialog').unblock();

        postOCEWebRequest(0);

    });

    $('#cancel_reject').click(function () {
        $("#data_entry_dialog").unblock();
    });

    $('#cancel').click(function () {
        $("#dialog").dialog('close');
        $.unblockUI();
    });

    $('#edit_micr').click(function () {
        $("#micr_div").addClass('hidden');
        $("#micr_div_edit").removeClass('hidden');

        $("#cu_micr_text").attr("value", $("#cu_micr_div").text());
    });

    $('#done_edit_micr').click(function () {
        $("#micr_div_edit").addClass('hidden');
        $("#micr_div").removeClass('hidden');

        $("#cu_micr_div").text($("#cu_micr_text").attr("value"));
    });

    $('#cancel_edit_micr').click(function () {
        $("#micr_div_edit").addClass('hidden');
        $("#micr_div").removeClass('hidden');
    });

    $('#front_image').click(function () {
        $('#popup_image').attr('src', _frontImg);
        $("#dialog").dialog('open');
    });


    $('#rear_image').click(function () {
        $('#popup_image').attr('src', _rearImg);
        $("#dialog").dialog('open');
    });

    $("#cancelBatch").click(function () {
        DOM.DIV.PreInsert.hide();
        DOM.DIV.ScannerController.show();
    });

    $("#CancelBatchScan").click(function () {
        CancelBatch();
    });

    $("#okPostScanned").click(function () {
        ResetPage();
    });

    $("#printPostScannedRejected").click(function () {

        var t = _dbResponse;
        var a = { cheques: _scannedDocs, dbResponse: _dbResponse };
        var url = 'RejectedCheques.aspx';

        var r = window.showModalDialog(url, a, "dialogwidth: 650px; dialogheight:700px; resizable: yes; dialogHide:yes");

        if (r == "cancel" || r == null) {

        }
    });


    DOM.Dialog.Popup.dialog({
        title: "Popup Image",
        bgiframe: false,
        autoOpen: false,
        modal: true,
        height: 400,
        width: 775,
        buttons: {
            Ok: function () {
                $(this).dialog('close');
            }
        }
    });


    DOM.Dialog.PopupImage.dialog({
        title: "Scanned Cheques...",
        bgiframe: false,
        autoOpen: false,
        modal: true,
        resizable: false,
        height: 380,
        width: 920,
        buttons: {
            Ok: function () {
                $(this).dialog('close');
            }
        }
    });


    function InsertIntoDatabase() {
        var len = _scannedDocs.length;
        for (i = len - 1; i >= 0; i--) {
            if (!_scannedDocs[i].selected)
                _scannedDocs.splice(i, 1);
        }



        var _count = _scannedDocs.length;
        for (i = 0; i < _count; i++) {

            _scannedDocs[i].batchid = ""; //Batch No will be handled in server side.
            if (_scanMode == ScanModeEnum.Batch || _scanMode == ScanModeEnum.Single) {
                _scannedDocs[i].type = WS_InstrumentType.Cheque;
                _scannedDocs[i].status = "outward_scanned";
            }
            else if (_scanMode == ScanModeEnum.ReScanBatch || _scanMode == ScanModeEnum.ReScanSingle) {
                _scannedDocs[i].type = WS_InstrumentType.ReScanCheque;
                _scannedDocs[i].status = "outward_scanned";

                //_scannedDocs[i].representment = _representmentCount;
            }
            else if (_scanMode == ScanModeEnum.DepositSlipBatch || _scanMode == ScanModeEnum.DepositSlipSingle) {
                _scannedDocs[i].type = WS_InstrumentType.DepositSlip;
                _scannedDocs[i].status = "deposit_slip_scanned";
            }
            else if (_scanMode == ScanModeEnum.RepresentBatch) {
                _scannedDocs[i].type = WS_InstrumentType.RepresentCheque;
                _scannedDocs[i].status = "outward_scanned";
            }
        }
        //Upload All The Data into Server
        postOCEWebRequestBatch();
    }




    //////////////////////////////////////////////////////////
    //Obsolete function.... need to be rewritten
    function ScanDepositSlip() {
        try {

            if (isScannerReady == false) {
                alert("Scanner is not ready!");
                return;
            }

            _scanMode = ScanModeEnum.DepositSlipBatch; //MyDef
            _scannedDocs = new Array();
            _scanIndex = 0;
            DOM.DIV.ScanCount.text("");


            //Show Modal Scanning Dialog....
            DOM.Dialog.Overlay.show();
            DOM.Dialog.ScanningImagesView.show();
            DOM.DIV.PreInsert.hide();
            DOM.DIV.PostInsert.hide();

            //Blocked until scanning is finished.
            var num = DOM.COM.Scanner.ScanBatch();

            // Load the last image
            if (num > 0) {
                alert(num + " deposit slips were scanned.");
            }
            else {
                alert("No deposit slips were scanned.");
                //Reset Settings...
                ResetPage();
                return;
            }
        }
        catch (e) {
            alert("Error:335:" + e.description);
            ResetPage();
            return;
        }
        //Close Modal Scanning Dialog....
        DOM.Dialog.Overlay.hide();
        DOM.Dialog.ScanningImagesView.hide();
        DOM.DIV.PreInsert.show();
        DOM.DIV.ScannerController.hide();



        createPreInsertTable(_scannedDocs);

        EnableScanButtons();
    }

    function ShutDownScanner() {
        DOM.COM.Scanner = GetScannerCom();
        //DOM.COM.Scanner.attachEvent('OnShutDownComplete', fOnShutDownCompletenew);
        DOM.COM.Scanner.ShutDownScanner();
        //DisableScanButtons();
    }
    ////////////////////////////////////////////

    // Initialize the scanner
    function InitializeScanner() {
        DisableScanButtons();
        DOM.COM.Scanner = GetScannerCom();

        //Attach Events
        
        //Call Initialize
        try {
            
            DOM.COM.Scanner.InitializeNew(DOM.Cheque.Endorsement.is(':checked'));
            
        } catch (e) {
            DOM.COM.Scanner.Initialize();
        } 
        
        //var serial = comScanner.GetSerialNo();
        //_useOcr = $("#use_ocr").val();
    }

    

    ///main()//
    try {
        InitializeScanner();
    }
    catch (e) {
        alert("Warning:\nUnable to initialize Scanner.\nProbably The Scanner Driver is not installed or you are using a non-Internet Explorer Browser.\nPlease try in internet explorer 7+ and install the scanner drivers.");
        window.close();
    }

    

    window.onbeforeunload = function () {

        return "Do you want to continue scanning ?";
    };

    window.onunload = function () {


        //DOM.COM.Scanner.attachEvent('OnShutDownComplete', fOnShutDownCompletenew);
        try {
            ShutDownScanner();
        } catch (e) {

        }
    };
};



//window.onbeforeunload = function () {
//    document.getElementById("COM123").ShutDownScanner();
//    return "Are you sure u want to stop scanning?";
//}