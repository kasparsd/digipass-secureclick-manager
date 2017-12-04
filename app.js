var app = angular.module('app', []);

app.controller('MainCtrl', function($scope,$sce) {
  //variables for command and specific task --start
  //request codes
  var firmware_file_size=0,
  FIRMWARE_BLOCK_SIZE=0x20,
  FirmwareFileData=null,
  START_APP=0xff,
  
  //usb commands
  LISTBONDS=0x0A,
  ADDNEWBONDS=0x0B,
  DONGLEVERSION=0x0C,
  FRIMWAREUPDATE=0x0D,
  ERASEBONDS=0x0E,
  LEDCONTROL=0x0F,
	REDLED=0x01,
	GREENLED=0x02,
	BLUE=0x03,
	LEDON=0x01
	LEDOFF=0x00,
  UNLOCKMANAGER=0x10,
  GETRSSI=0x11,
  REQVER=0x12,
  DISCONNECT_BLE=0x14,
  SET_PAIRINGCODE=0x19,													//bta,pairing
  AppletVersion=null,
  MI_GET_DONGLE_STATE=0x20,
  MI_CONNECT_TO=0x21,
	CONNECT_TO_DFU_DEVICE = 0x01,
	CONNECT_TO_GEN_DEVICE = 0x02,
	CONNECT_TO_UNKNOWN_DFU_DEVICE = 0x04,
  //response code
  REQUESTSUCCESS=[0x90,0x00],
  //REQUESTERROR=[0x69,0xXX],
  LISTBONDSNOBONDS=[0x69,0x05],
  ADDNEWBONDFAIL=[0x69,0x01],
  ADDNEWBONDTIMEOUT=[0x69,0x02],
  ADDNEWBONDSALREADYBOND=[0x69,0x03],
  ADDNEWBONDSWAITING=[0x69,0x04],
  ADDNEWBONDSFOUNDNEW=[0x69,0x06],
  ADDNEWBONDSPAIRINGCODESHOW=[0x69,0x08],
  ADDNEWBONDSWRONGPIN=[0x69,0x09],										//bta,pairing
  ADDNEWBONDSREQUESTPIN=[0x69,0x10],								  //bta,pairing
  ADDNEWBONDSTOMUCHBONDS=[0x69,0x12],
  connection_cid=null,
  BROADCAST_CID=new Uint8Array([0xff, 0xff, 0xff, 0xff]),
  appletVersion=new Uint8Array([0x83, 0x00, 0x09, 0x00, 0xC0, 0x1A, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00]),
  eraseBondFIDO = new Uint8Array([ 0x83, 0x00, 0x09, 0x00, 0xC7, 0x1A, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00]),
  getRSSIValueFIDO = new Uint8Array([ 0x83, 0x00, 0x11, 0x00, 0xCA, 0x1A, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
  MY_HID_VENDOR_ID  = 0x1A44,
  MY_HID_PRODUCT_ID = 0x80BB,
  MY_HID_PRODUCT_ID_FIDO = 0x00bb,
  windowWidth = 505,
  windowheightBasic = 490,
  windowheightAdv = 610,
  lostConnectionTimeout = 400,
  DPBB_PID_VID_MI_ONLY            = "vid_1a44&pid_80bb",
  DPBB_PID_VID_MI_AND_FIDO_FIDO   = "vid_1a44&pid_00bb&mi_00",
  DPBB_PID_VID_MI_AND_FIDO        = "vid_1a44&pid_00bb&mi_01",
  DEVICE_INFO_DONGLE = {"vendorId": MY_HID_VENDOR_ID, "productId": MY_HID_PRODUCT_ID },
  DEVICE_INFO_FIDO = {"vendorId": MY_HID_VENDOR_ID, "productId": MY_HID_PRODUCT_ID_FIDO },
  connectionId=null,
  connectionId_FIDO=null,
  connectionId_FIDO_FIDO=null,
  receiveInterval=null,
  receivePending=false,
  RSSI_REQ_ITERATIONS = 5,
  Conn_Req_Iterations=30,
  count_tries=0,
  dongleRSSIVal=0,
  BROADCAST_CID=new Uint8Array([0xff, 0xff, 0xff, 0xff]),
  ALLOCATE_CID=new Uint8Array([0x86, 0x00, 0x08, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]),
  funcToExec=[],
  no_batteryTry=0,
  total_batteryTry=50,
  no_firmwareTry=0,
  total_firmwareTry=50;
  total_newbondTry=20,
  no_of_newbondTry=0,
  rssidp_count_tries=0,
  no_connectReq=0,
  outputDiv=null,
  total_rssi_dp_go=0,
  rssi_count_tries=0,
  total_rssi_dongle=[],
  DEVICENOTFOUND='DEVICENOTFOUND',
  UNKNOWN_ERROR=0x99,
  REQUESTING='REQUESTING_STATE',
  CONNECTDEVICE='CONNECTDEVICE',
  DEVICECONNECTED='DEVICECONNECTED',
  ADDNEWBONDADDED='ADDNEWBONDADDED',
  fromNewBond=false,
  firmwareOutput='',appletOutput='',
  BBRssiOutput='',
  constantMsg=false,
  reusableReport=null,
  alreadyInDFUFlg=false,
  dfu_contains=null,
  transferFidoFrmIdx=0,
  data=new Uint8Array(64),
  signData=new Uint8Array(64),
  isRssiCmd=false,
  dfuFound=false,
  reInitDivStyle=true,
  newAppStarted=false,
  max_get_dongle_try=30,
  appletOutput="",firmwareOutput="",batteryOutputTxt="",
  deactivateMsgTimer=null;
  vm=this;
  vm.outputColor='outputDivColor';
  var report;
  var firmIdx=0;
  var clickedTarget=null;
  var stopConnection=true;
  var SetDongeReport;
  var advanced=false;
  var firmwareUpdateMenu=false;
  var latestNotificationCont;
  
  var uuidWriteLength;
  var uuidWriteUUID;
  var uuidWriteData = new Uint8Array(64);
  var uuidWriteReportID;
  var waitForPostThirdNotificationIdx = 0;
  var waitForPostThirdNotificationCont = false;
  var amountDevices = 0;
  var deviceIds = [];
  var DpbbStateJustChanged = false;
  var hidConnectToDevice;
  var oldVersion = false;									//version with minimum handles u2f version 1.0
  
  	self.resizeTo(windowWidth,windowheightBasic);
	
	document.getElementById('advancedFunctions').style.height = '0';
	document.getElementById('feedback').style.heigth = '0';
	
	document.getElementById('DPBBupdate').style.height = '0';
	document.getElementById('eraseBondDongle').style.height = '0';
	
	document.getElementById('update').style.height = '0';
	
	document.getElementById('updateVersionDongle').style.height = '0';
	document.getElementById('updateVersionFIDO').style.height = '0';
	
	document.getElementById('fileUploadCtrlBleDev').style.visibility = 'hidden';
	document.getElementById('fileUploadCtrlDongle').style.visibility = 'hidden';
	
	document.title = chrome.i18n.getMessage("appName");

	document.getElementById('title').innerHTML = chrome.i18n.getMessage("htmlTitle");
	document.getElementById('Add_ble_dev_label').innerHTML = chrome.i18n.getMessage("Add_ble_dev_label");
	document.getElementById('Erase_ble_dev_pairings_label').innerHTML = chrome.i18n.getMessage("Erase_ble_dev_pairings_label");
	document.getElementById('firmware_update_label').innerHTML = chrome.i18n.getMessage("firmware_update_label");
	document.getElementById('erase_dpbb_pairings_label').innerHTML = chrome.i18n.getMessage("erase_dpbb_pairings_label");
	document.getElementById('updateVersionDongle_label').innerHTML = chrome.i18n.getMessage("updateVersionDongle_label");
	document.getElementById('updateVersionFIDO_label').innerHTML = chrome.i18n.getMessage("updateVersionFIDO_label");
	
	chrome.hid.getDevices({},initialdetectDevice);
	
	function initialdetectDevice(devices)
	{
		console.log("initialdetectDevice " + devices.length);
		for(var i=0;i<devices.length;i++)
		{
			console.log("device " + i);
			if(devices[i].productId == 32955)
			{
			   deviceIds[amountDevices] = devices[i].deviceId;
			   amountDevices++;
			   deviceIds[amountDevices] = devices[i].deviceId;
			   amountDevices++;
			   console.log(amountDevices);
			}
			if(devices[i].productId == 187)
			{
			   deviceIds[amountDevices] = devices[i].deviceId;
			   amountDevices++;
			   console.log(amountDevices);
			}	
		}	
	}

	function detectDevice(device)
	{
	  console.log("detect device");
	  console.log(device.deviceId + ":" + device.productName + " - " + device.vendorId + ":" + device.productId ) 
	  if(device.productId == 32955)
	  {
		  deviceIds[amountDevices] = device.deviceId;
  		  amountDevices++;
		  deviceIds[amountDevices] = device.deviceId;
		  amountDevices++;
		  console.log(amountDevices);
	  }
	  if(device.productId == 187)
	  {
  		  deviceIds[amountDevices] = device.deviceId;
  		  amountDevices++;
		  console.log(amountDevices);
	  }
		DpbbStateJustChanged = true;
		setTimeout(function(){
				DpbbStateJustChanged = false;
            },2000)
	}
  
    function removeDevice(deviceId)
	{
		console.log("remove device - " + deviceId );
		for(var i = 0;i<amountDevices;i++)
		{
			console.log( deviceIds[i]);
			if(deviceIds[i] == deviceId)
			{
					deviceIds.splice(i,1);
					i--;
					amountDevices--;
			}
		}
		DpbbStateJustChanged = true;
		setTimeout(function(){
				DpbbStateJustChanged = false;
        },2000)
	}

  //variables for command and specific task --end
  chrome.hid.onDeviceRemoved.addListener(removeDevice);
  chrome.hid.onDeviceAdded.addListener(detectDevice);
  // chrome.hid.onDeviceRemoved.addListener(resetConnection)
  // chrome.hid.onDeviceAdded.addListener(resetConnection)

  function resetConnection(){
    connectionId_FIDO=null;
    connectionId_FIDO_FIDO=null;
    connectionId=null;
  }


  function initVarialbles(){
    console.log('in initVarialbles');
    $scope.$evalAsync(function (){
      console.log('in digest initVarialbles');
      vm.disableDivs=false;
      vm.addNewBond=false;
      vm.testRSSI=false;
      vm.eraseBondDongle=false;
      vm.eraseBondFIDO=false;
      vm.checkVersionDongle=false;
      vm.checkVersionFIDO=false;
      vm.updateVersionDongle=false;
      vm.updateVersionFIDO=false;
	  vm.ApplicationInfo=false;
	  vm.closeButton=false;
  	  vm.ChangeUImode=false;
	  vm.firmware_update=false;
	  vm.erase_dpbb_pairings=false;
	  vm.firmwareUpdate=false;
	  vm.DFUcheckSignature=false;
      // vm.addNewBondhover=false;
      // vm.testRSSIhover=false;
      // vm.eraseBondDonglehover=false;
      // vm.eraseBondFIDOhover=false;
      // vm.checkVersionDonglehover=false;
      // vm.checkVersionFIDOhover=false;
      // vm.updateVersionDonglehover=false;
      // vm.updateVersionFIDOhover=false;
      vm.exceptaddNewBond=false;
      vm.excepttestRSSI=false;
      vm.excepteraseBondDongle=false;
      vm.excepteraseBondFIDO=false;
      vm.exceptcheckVersionDongle=false;
      vm.exceptcheckVersionFIDO=false;
      vm.exceptupdateVersionDongle=false;
      vm.exceptupdateVersionFIDO=false;
    });
      firmware_file_size=0;
      receiveInterval=null;
      receivePending=false;
      RSSI_REQ_ITERATIONS = 5;
      Conn_Req_Iterations=30;
      count_tries=0;
      dongleRSSIVal=0;
      funcToExec=[];
      no_batteryTry=0;
      total_batteryTry=50;
      no_firmwareTry=0;
      total_firmwareTry=50;
      total_newbondTry=20;
      no_of_newbondTry=0;
      rssidp_count_tries=0;
      no_connectReq=0;
      outputDiv=null;
      total_rssi_dp_go=0;
      rssi_count_tries=0;
      total_rssi_dongle=[];
      firstTime=true;
      sum=0;
      firmIdx=0;
      manifest_fs=null;
      bin_fs=null;
      dat_fs=null;
      fido_state = null;
      dfu_state = null;
      gen_state = null;
      transferFidoFrmIdx=0;
      contLoop=true;
      dfuFound=false;
      stopWriteUUID=false;
      funcToExec=[];
      stopConnection=true;
      fromNewBond=false;
      isRssiCmd=false;
      connectionId_FIDO=null;
      connectionId_FIDO_FIDO=null;
      connectionId=null;
      clickedTarget=null;
      alreadyInDFUFlg=false;
      newAppStarted=false;
      console.log('done all var update');
  }

  function activateBtn(isFIDOMode,avoidDisconnect){
    //before activating the buttons disconnect from hid
    console.log('Activate Buttons');
	funcToExec=[];	
      if(avoidDisconnect){
        initVarialbles();        
      }else{
        disconnectBle(isFIDOMode,function(){
          unlock_dongle(isFIDOMode);
        });
        initVarialbles();
      }
	if(advanced == true)
	{
		document.getElementById('changeUImode').src = "Images/adv_min.png";
		document.getElementById('changeUImode').style.marginTop = "0px";
	}
	else
	{
		document.getElementById('changeUImode').src = "Images/adv_plus.png";
		document.getElementById('changeUImode').style.marginTop = "0px";
	}	
    console.log('clearing on focus');
    document.body.onfocus =null;

  }


  //functions for Dongle and Fido specific commands --start

  //0x14 used to disconnect in .net code no effect so commented 
  function disconnectBle(isFIDOMode,callback){
    report=reusableReport || new Uint8Array(64);
    report[0]=DISCONNECT_BLE;
    if(isFIDOMode){
      sendByteData(true,report,callback,connectionId_FIDO_FIDO,DISCONNECT_BLE,true);
    }
    else
      sendByteData(false,report,callback,connectionId,DISCONNECT_BLE,true);
  }
  
  // RSSI Value callback of usb dongle
  function rssiValueCallback(){
      isRssiCmd=true;
      no_connectReq=0;
      firstTime=true;
      rssi_count_tries=0;
      total_rssi_dongle=[];
      funcToExec.unshift(getRssiValue);
      funcToExec.unshift(getRssiValue);
      connectToDevice(false,executeTopFunction,false,false,GETRSSI);
  }

  //RSSI value callback of FIDO device
  function rssiValueCallback_go_dp(e,isRecurssiveCall){
    if(isRecurssiveCall){
      funcToExec.unshift(getRssiValue_go_dp);
      executeTopFunction();
    }else{
      no_connectReq=0;
      rssidp_count_tries=0;
      total_rssi_dp_go=0;
      funcToExec.unshift(allocateCid);
      funcToExec.unshift(getRssiValue_go_dp);
      connectToDevice(true,executeTopFunction,false,false,'UUID_getRSSI_dp_go');
    }
  }

  //get RSSI value command for usb device
   function getRssiValue(){
    report=new Uint8Array(64);
    report[0]=GETRSSI;
    sendByteData(true,report,null,connectionId_FIDO_FIDO)
  }

  //get RSSI value command of FIDO device
  function getRssiValue_go_dp(){
    report=new Uint8Array(64);
    for(var i=0;i<connection_cid.length;i++){
      report[i]=connection_cid[i];
    }
    for(var i=0;i<getRSSIValueFIDO.length;i++){
      report[i+connection_cid.length]=getRSSIValueFIDO[i];
    }
    sendByteData(true,report,null,connectionId_FIDO,'UUID_getRSSI_dp_go');
  }

  //callback of erase bond of FIDO device click
  function eraseBondFidoCallback(){
    no_connectReq=0;
    funcToExec.unshift(allocateCid);
    funcToExec.unshift(eraseBondsFromFIDO);
    connectToDevice(true,executeTopFunction,null,null,'eraseBondFIDO');
  }

  //unlock enumeration mode command
  function unlock_dongle(isFIDOMode){
    var bytes = new Uint8Array(64);
    bytes[0] = UNLOCKMANAGER;//to send 0x0C to HID device
    if(isFIDOMode)
      sendByteData(true,bytes,disconnectDevice,connectionId_FIDO_FIDO); 
    else
      sendByteData(false,bytes,disconnectDevice,connectionId); 
  }

  //callback for dongle firmware version
  function versionDongleCallback(){
    no_connectReq=0;
    funcToExec.unshift(getVersionDongle);
    connectToDevice(false,executeTopFunction,null,null,'versionDongle');
  }

  //command to get dongle firmware version
  function getVersionDongle(isFIDOMode){
    var bytes = new Uint8Array(64);
    bytes[0] = DONGLEVERSION;					//to send 0x0C to HID device
    if(!isFIDOMode)
      sendByteData(false,bytes,null,connectionId); 
    else if(isFIDOMode)
      sendByteData(true,bytes,null,connectionId_FIDO_FIDO); 
  }

  //command to erase bond of FIDO device
  function eraseBondsFromFIDO(){
    report=new Uint8Array(64);
    for(var i=0;i<connection_cid.length;i++){
      report[i]=connection_cid[i];
    }
    for(var i=0;i<eraseBondFIDO.length;i++){
      report[i+connection_cid.length]=eraseBondFIDO[i];
    }
    sendByteData(true,report,null,connectionId_FIDO,'UUID_eraseBonds_dp_go');
  }

  //command to add new bond
  function addNewBondCallback(e,isRecurssiveCall){
    //console.log('sending new bond cmd recursive='+isRecurssiveCall);
    funcToExec.unshift(addNewBondCmd);
    if(!isRecurssiveCall){
      no_of_newbondTry=0; //new bond count reset
    }
    no_connectReq=0;
    connectToDevice(false,executeTopFunction,null,null,'addNewBond');
  }

  //erase bond callback
  function eraseBondCallback(){
    no_connectReq=0;
    funcToExec.unshift(eraseBondCmd);
    connectToDevice(false,executeTopFunction,null,null,'eraseBondDongle');
  }

  //command to add new bond
  function addNewBondCmd(){
    sendHid(ADDNEWBONDS);
  }

  //command to erase new bond
  function eraseBondCmd(){
    sendHid(ERASEBONDS);
  }

  //callback to get secure click firmware version
  function getSecureClickVersion(){
    no_connectReq=0;
	oldVersion = false;														//reset the oldversion Variable
    funcToExec.unshift(allocateCid);
    funcToExec.unshift(getApppletVersion);
    funcToExec.unshift(getFirmwareVersion);
    funcToExec.unshift(getBatteryLevel);
	funcToExec.unshift(DisconnectFromBLE);
    connectToDevice(true,executeTopFunction,null,null,'checkVersionFIDO');
  }

  //execute top of stack function
  function executeTopFunction(isFIDOMode){
    if(funcToExec.length>0)
      (funcToExec.pop())(isFIDOMode);
  }

  //disconenct the device after all commands are executed
  function disconnectDevice(){
    no_connectReq=0;
    //FIDO mode disconnect
    if(connectionId_FIDO){
      var tempConn=connectionId_FIDO_FIDO;
      chrome.hid.disconnect(connectionId_FIDO,function(){
        connectionId_FIDO=null;
        if(tempConn){
          chrome.hid.disconnect(tempConn,function(){
            connectionId_FIDO_FIDO=null;
          });
        }
      });
    }
    //MAnager mode disconnect
    if(connectionId){
      chrome.hid.disconnect(connectionId,function(){
        connectionId=null;
      })
    }
  }

  //handle chrome error
  function handleRuntimeException(){
    console.log('chrome exception');
	console.log(chrome.runtime.lastError);
    Feedback_updater(null,'CHROMEEXCEPTION');
    deActivateMsg(null,true);
  }

  //connect to the required enumerated device
  function connectToDevice(isFIDOMode,callback,hideOutput,isRecurssiveCall,category){
    if(stopConnection){
      return;
    }
    //console.log('in connect to DEvice func');
    try{
      showStatus(category,'processing');
      if(category=='versionDongle' || category=='GETDONGLESTATE' || category=='SetDongleConnectTo' || category=='eraseBondDongle' || category=='addNewBond'){
        chrome.hid.getDevices({}, function(devices) {
          if (chrome.runtime.lastError) {
            console.log('connectToDevice error: ');
            handleRuntimeException();
            return;
          }
          // console.log('in version dongle devices='+devices);
          if(devices.length==1){
            isFIDOMode=false;
          }else if(devices.length==2){
            isFIDOMode=true;
          }
        });
      }
      chrome.hid.getDevices({}, function(devices) {
        if (chrome.runtime.lastError) {
          console.log('hid get devices error:');
          handleRuntimeException();
          return;
        }
        // console.log('chk B');
        if(devices && devices.length && devices.length==2 && isFIDOMode){
            // console.log('chk E');
            if(category=='CHECKGO225'){
              alreadyInDFUFlg=false;
              callback();
              return;
            }
		  if (devices[0].collections[0].usagePage == 61904)							//fido interface
			  hidConnectToDevice = devices[0].deviceId;
		  else
			  hidConnectToDevice = devices[1].deviceId;
		  
          chrome.hid.connect(hidConnectToDevice, function(connectionfido) {
            if (chrome.runtime.lastError) {
              console.log('hid connect 1 error:');
			  setTimeout(function(){connectToDevice(isFIDOMode,callback,hideOutput,isRecurssiveCall,category);},lostConnectionTimeout);					//retry
              //handleRuntimeException();																												//no feedback
              return;
            }
            if(connectionfido==undefined || connectionfido.connectionId==undefined){
                // console.log('exception');
                throw 'connection not found';
            }
             connectionId_FIDO = connectionfido.connectionId;
			 
			if (devices[0].collections[0].usagePage == 61166)							//manager interface
				hidConnectToDevice = devices[0].deviceId;
			else
				hidConnectToDevice = devices[1].deviceId;
			
            chrome.hid.connect(hidConnectToDevice, function(connectionfidofido) {
                if (chrome.runtime.lastError) {
                  console.log('hid connect 2 error:');
                  handleRuntimeException();
                  return;
                }
                // Feedback_updater(CONNECTDEVICE,DEVICECONNECTED,null,hideOutput);
                if(connectionfidofido==undefined || connectionfidofido.connectionId==undefined)
                  throw 'connection not found';
                connectionId_FIDO_FIDO = connectionfidofido.connectionId;
                if(callback){
                  //   console.log('chk H');
                  // console.log(callback);
                  // console.log('in callback');
                  // console.log(funcToExec);
                  // console.log('------------calling executeTopFunction');
                  callback(isFIDOMode);
                }
                // if(isRecurssiveCall && Conn_Req_Iterations>no_connectReq){
                //   no_connectReq++;
                //   if(callback)
                //     callback();
                //     console.log('chk H');
                // }else if(callback && !isRecurssiveCall){
                //     console.log('chk I');
                //   callback();
                // }
              return true;
            });
          });
        }else if(devices && devices.length && devices.length==1 && !isFIDOMode){
          chrome.hid.connect(devices[0].deviceId, function(connection) {
			console.log("device[0]:" + devices[0].collections[0].usagePage);
            // Feedback_updater(CONNECTDEVICE,DEVICECONNECTED,null,hideOutput);
                if (chrome.runtime.lastError) {
                  if(category=='GETDONGLESTATE' && Conn_Req_Iterations>no_connectReq){
                    // console.log('trying to connect again');
                    connectToDevice(isFIDOMode,callback,hideOutput,isRecurssiveCall,category);
                    return;
                  }else{
                    console.log('hid connect 3 error:');
					setTimeout(function(){connectToDevice(isFIDOMode,callback,hideOutput,isRecurssiveCall,category);},lostConnectionTimeout);					//retry
                    //handleRuntimeException();																													//nofeedback
                    return;
                  }
                }
            if(connection==undefined || connection.connectionId==undefined){
                  // console.log('got err');
                  throw 'connection not found';
            }
              connectionId = connection.connectionId;
              if(callback){
                // console.log('in callback');
                // console.log(funcToExec);
                callback(isFIDOMode);
              }
            return true;
          });
        }else{
          if(Conn_Req_Iterations>no_connectReq){
            console.log('chk C');
            console.log(no_connectReq)
            no_connectReq++;
            showStatus(category,'processing');
            setTimeout(function(){
              // console.log('calling connectToDevicefunc i='+Conn_Req_Iterations);
              if(isRssiCmd)
                connectToDevice(true,executeTopFunction);
              else
                connectToDevice(isFIDOMode,callback,hideOutput,true,category)
              // connectToDevice(true,executeTopFunction);
            },500)
          }else{
            // if(category=='CHECKGO225'){
            //   // console.log('---------calling already in dfu---------');
            //   alreadyInDFUFlg=true;
            //   callback();
            //   return;
            // }else{
              console.log('chk D');
              // console.log(category);
              showStatus(category,'exit');
              // deActivateMsg();
              // Feedback_updater(CONNECTDEVICE,DEVICENOTFOUND,null,hideOutput);
              return false;
            // }
            
          }
        }
      });
    }catch(e){
      console.log('in trys catch');
      if(Conn_Req_Iterations>no_connectReq){
        connectToDevice(isFIDOMode,callback,hideOutput,true,category)
        // connectToDevice(isFIDOMode,callback,hideOutput);
        //console.log('calling connectToDevicefunc');
      }
    }
  }

  function showStatus(cmd,state){
    if(isRssiCmd && state=='processing')
      Feedback_updater('TESTBLE',REQUESTING);
    else if(isRssiCmd && state=='exit')
      Feedback_updater(GETRSSI,DEVICENOTFOUND);
    else
      switch(state){
        case 'exit':
          switch(cmd){
            case 'eraseBondDongle':
              Feedback_updater(null,DEVICENOTFOUND);
            break;
            case 'checkVersionFIDO':
              Feedback_updater(GETRSSI,DEVICENOTFOUND);
            break;
            case 'addNewBond':
              Feedback_updater(ADDNEWBONDS,ADDNEWBONDTIMEOUT);
            break;
            case 'RSSIVAL':
              Feedback_updater(GETRSSI,DEVICENOTFOUND);
            break;
            case 'UUID_getRSSI_dp_go':
              Feedback_updater(GETRSSI,DEVICENOTFOUND);
            break;
            case 'eraseBondFIDO':
              Feedback_updater(GETRSSI,DEVICENOTFOUND);
            break;
            case 'versionDongle':
              Feedback_updater(null,DEVICENOTFOUND);
            break;
            case 'dongleUpdate':
              Feedback_updater(null,DEVICENOTFOUND);
              deActivateMsg();
            break;
            case 'GETDONGLESTATE':
              Feedback_updater(GETRSSI,DEVICENOTFOUND);
              deActivateMsg();
            break;
            case 'STARTSECURECLICKUPDATE':
              Feedback_updater(GETRSSI,DEVICENOTFOUND);
              deActivateMsg();
            break;
          }
        break;
        case 'processing':
          switch(cmd){
            case 'versionDongle':
              Feedback_updater('versionDongle',REQUESTING);
            break;
            case 'eraseBondFIDO':
              Feedback_updater('eraseBondFIDO',REQUESTING);
            break;
            case 'eraseBondDongle':
              Feedback_updater('eraseBondDongle',REQUESTING);
            break;
            case 'checkVersionFIDO':
              Feedback_updater('UUID_FIRMW_VERS',REQUESTING);
            break;
            case 'addNewBond':
              //Feedback_updater(ADDNEWBONDS,REQUESTING);
            break;
            case 'RSSIVAL':
              Feedback_updater('TESTBLE',REQUESTING);
            break;
            case 'UUID_getRSSI_dp_go':
              Feedback_updater('TESTBLE',REQUESTING);
            break;
            case 'dongleUpdate':
              Feedback_updater('dongleUpdate',FRIMWAREUPDATE);
            break;
          }
        break;
      }
  }

  //alocate CID channel id for communication
  function allocateCid(){
    var ALLOCATE_CID=new Uint8Array([0x86, 0x00, 0x08, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);
    report=new Uint8Array(64);
    for(var i=0;i<BROADCAST_CID.length;i++){
      report[i]=BROADCAST_CID[i];
    }
    var BROADCAST_CIDLen=BROADCAST_CID.length;
    for(var i=0;i<ALLOCATE_CID.length;i++){
      report[i+BROADCAST_CIDLen]=ALLOCATE_CID[i];
    }
    sendByteData(true,report,null,connectionId_FIDO);
  }

  //get applet version from device
  function getApppletVersion(){
    report=new Uint8Array(64);
    for(var i=0;i<connection_cid.length;i++){
      report[i]=connection_cid[i];
    }
    for(var i=0;i<appletVersion.length;i++){
      report[i+connection_cid.length]=appletVersion[i];
    }
    sendByteData(false,report,null,connectionId_FIDO,'UUID_get_AppletVersion');
  }

  //send command to HID
  function sendHid(cmd,callback){
    var bytes = new Uint8Array(64);
    bytes[0] = cmd;//to send 0x0C to HID device
    sendByteData(false,bytes,callback,connectionId || connectionId_FIDO_FIDO); 
  }

  //get firmware version command
  function getFirmwareVersion(){
    var bytes=new Uint8Array(64);
    var UUID_FIRMW_VERS   = new Uint8Array([0x2a, 0x26]);
    /*bytes[0]=0x12;
	bytes[1]=(UUID_FIRMW_VERS.length & 0xFF);
    bytes[2]=0x2a;
    bytes[3]=0x26;*/
	bytes[0] = 0x17;								//read handle
	bytes[1] = 4;
	bytes[2] = 0x00;
	bytes[3] = 0x21;

    sendByteData(true,bytes,null,connectionId_FIDO_FIDO,'UUID_FIRMW_VERS');  
  }

  //get current battery level of FIDO
  function getBatteryLevel(){
    var bytes=new Uint8Array(64);
    /*var UUID_FIRMW_VERS   = new Uint8Array([0x2a, 0x19]);
    bytes[0]=0x12;
    bytes[1]=(UUID_FIRMW_VERS.length & 0xFF);
    bytes[2]=0x2a;
    bytes[3]=0x19;*/	
	if(oldVersion == true)
	{
		console.log("old version");
		bytes[0] = 0x17;								//read handle
		bytes[1] = 4;
		bytes[2] = 0x00;
		bytes[3] = 0x24;
	}
	else
	{
		console.log("new version");
		bytes[0] = 0x17;								//read handle
		bytes[1] = 4;
		bytes[2] = 0x00;
		bytes[3] = 0x26;
	}
	
	sendByteData(true,bytes,null,connectionId_FIDO_FIDO,'UUID_BAT_LVL'); 
		
  }
  
    function DisconnectFromBLE(){
    var bytes=new Uint8Array(64);
    bytes[0]=DISCONNECT_BLE;
    sendByteData(true,bytes,null,connectionId_FIDO_FIDO,'DISCONNECT_BLE');  
  }

  //send byte data and on callback receive data
  function sendByteData(isFIDOMode,bytes,callback,connectionObj,categoryName,hideOutput,isFirmwareUpdate){
    // console.log(categoryName);
    // console.log('----sendbytedata----');
    // console.log('isFIDOMode='+isFIDOMode);
    // console.log('sendbytedata=');
    // console.log(bytes);
    // console.log('connectionobj='+connectionObj);
    // console.log('categoryName='+categoryName);
    // console.log('isFirmwareUpdate='+isFirmwareUpdate);
    // console.log('sendbytedata');
	
    if(categoryName=='GETDONGLESTATE' || categoryName=='setDongleConnectTo' ){
      connectionObj=connectionId_FIDO_FIDO || connectionId;
    } else if(categoryName=='WriteUUID'){
        connectionObj=connectionId;
    }
    if(connectionObj && !stopConnection){
       // console.log('data sending');
       // for(var i=0;i<bytes.length;i++)
       //   console.log(bytes[i]);
        // console.log('----sendbytedata----');
        // console.log('isFIDOMode='+isFIDOMode);
        // console.log('sendbytedata=');
        // console.log(bytes);
        // console.log('connectionobj='+connectionObj);
        // console.log('categoryName='+categoryName);
        // console.log('isFirmwareUpdate='+isFirmwareUpdate);
      chrome.hid.send(connectionObj,0,bytes.buffer,function(){
        if (chrome.runtime.lastError) {
            // console.log('in send exception');
            if(Conn_Req_Iterations>no_connectReq){
              // console.log('no_connectReq='+no_connectReq);
              no_connectReq++;
              connectToDevice(isFIDOMode,function (){
                sendByteData(isFIDOMode,bytes,callback,connectionObj,categoryName,hideOutput);
              },hideOutput,false,categoryName);
            }else{
              console.log('hid send error');
              handleRuntimeException();
              return;
            }
            //console.log(chrome.runtime.lastError.message);
              // console.log('calling connectToDevicefunc');
            // connectToDevice(isFIDOMode,function (){
            //   // //console.log('connecting again...')
            //   sendByteData(isFIDOMode,bytes,callback,connectionObj,categoryName,hideOutput);
            // },hideOutput,true,categoryName);
            // return;
          }else {
            if(isFirmwareUpdate && callback)
              callback();
            else{
              console.log(categoryName);
              receiveData(callback,connectionObj,categoryName,isFIDOMode,hideOutput);
            }
          }
      });
    }else if(!stopConnection){
      // if(categoryName=='GETDONGLESTATE'){
      //   connectionObj=connectionId_FIDO_FIDO;
      // }
      if(Conn_Req_Iterations>no_connectReq){
        no_connectReq++;
        connectToDevice(isFIDOMode,function (){
          sendByteData(isFIDOMode,bytes,callback,connectionObj,categoryName,hideOutput);
        },hideOutput,false,categoryName);
      }
    }
  }

  //receive data and processs output using showOutput()
  function receiveData(callback,connectionObj,categoryName,isFIDOMode,hideOutput){
    // console.log('--------receiving data-----------');
    chrome.hid.receive(connectionObj, function(reportId, data) {
      if (chrome.runtime.lastError) {
        // console.log(categoryName);
        // if(categoryName=='StartUpdatedApplication'){
        //   console.log('directly calling version info');
        //   console.log(callback);
        //   callback();
        // }
        // else{
          console.log('hid receive error: ' + chrome.runtime.lastError);
          handleRuntimeException();
          return;
        // }
      }else{
          if (data != null) {
            var dataDecoded=new Uint8Array(data);
            // console.log('data received');
            // for(var i=0;i<dataDecoded.length;i++)
            //   console.log(dataDecoded[i]);
            reusableReport=dataDecoded;
            // if(dfuFound){
            //   console.log('data received=');
            //   var txtcon='';
            //   for(var i=0;i<dataDecoded.length;i++){
            //     txtcon+=" "+dataDecoded[i].toString(10);
            //   }
            //   console.log("i="+txtcon);
            // }
            if(categoryName)
              showOutput(isFIDOMode,dataDecoded,categoryName,hideOutput,callback);
            else
              showOutput(isFIDOMode,dataDecoded,null,hideOutput);
          }else{
              appendTextToOutput("Received but no data");
          }
      }
      if(callback && !(categoryName=='WriteUUID' || categoryName=='latestNotification'))
          callback();
    });
  }
var data=new Uint8Array(64);
  //function to show different output based on command and result
  function showOutput(isFIDOMode,dataDecoded,spclCategory,hideOutput,callback){
    // console.log('response data=');
    // for(var i=0;i<64;i++)
    //   console.log(dataDecoded[i]);
    if(spclCategory && !hideOutput){
      switch(spclCategory){
        case 'latestNotification':
          signData=dataDecoded;
            report=dataDecoded;
          if(dataDecoded[2].toString(16)==REQUESTSUCCESS[0].toString(16) && dataDecoded[3].toString(16)==REQUESTSUCCESS[1].toString(16)){
            callback();
          }else{
            if(callback)
              callback();
          }
          break;
        case 'WriteUUID':
            report=dataDecoded;
            data=dataDecoded;
          if(dataDecoded[2].toString(16)==REQUESTSUCCESS[0].toString(16) && dataDecoded[3].toString(16)==REQUESTSUCCESS[1].toString(16)){
            WriteUUIDCont=false;
            callback();
          }else{
            if(callback)
              callback();
          }
        break;
        case 'UUID_FIRMW_VERS':
            if(dataDecoded[2].toString(16)==REQUESTSUCCESS[0].toString(16) && dataDecoded[3].toString(16)==REQUESTSUCCESS[1].toString(16)){
                var opString=String.fromCharCode.apply(null, dataDecoded);
				var length = dataDecoded[1] - 2;
                var updatedStr=opString.substr(4,length);
                // vm.constantMsg=false;
				if(updatedStr.indexOf('.') > -1)
				{
					console.log(". in the string, go further")

					Feedback_updater(spclCategory,REQUESTSUCCESS,updatedStr);
					executeTopFunction();
				}
				else
				{
					    var bytes=new Uint8Array(64);
						console.log("no . in the string")
						bytes[0] = 0x17;								//read handle
						bytes[1] = 4;
						bytes[2] = 0x00;
						bytes[3] = 0x1f;
						oldVersion = true;								//first try fails, this is a version u2f 1.0
							
						sendByteData(true,bytes,null,connectionId_FIDO_FIDO,'UUID_FIRMW_VERS'); 
				}
            }else{
                if(no_firmwareTry<total_firmwareTry){
                  // Feedback_updater(spclCategory,REQUESTING);
                  no_firmwareTry++;
                  setTimeout(function(){getFirmwareVersion();},100);
                }else{
                  Feedback_updater(spclCategory,UNKNOWN_ERROR);
                }
            }
            break;
        case 'UUID_BAT_LVL':
            if(dataDecoded[2].toString(16)==REQUESTSUCCESS[0].toString(16) && dataDecoded[3].toString(16)==REQUESTSUCCESS[1].toString(16)){
                Feedback_updater(spclCategory,REQUESTSUCCESS,dataDecoded[4]);
                // setTimeout(function(){activateBtn(true);},100);
                executeTopFunction();
            }else{
                if(no_batteryTry<total_batteryTry){
                  // Feedback_updater(spclCategory,REQUESTING);
                  no_batteryTry++;
                  setTimeout(function(){getBatteryLevel();},100);
                }else{
                  Feedback_updater(spclCategory,UNKNOWN_ERROR);
                }
            }
            break;
        case 'UUID_getRSSI_dp_go':
            if(dataDecoded[19].toString(16)==REQUESTSUCCESS[0].toString(16) && dataDecoded[20].toString(16)==REQUESTSUCCESS[1].toString(16)){
              if(rssidp_count_tries<RSSI_REQ_ITERATIONS){
                var dv = new DataView(dataDecoded.buffer, 0);
                total_rssi_dp_go+=dv.getInt8(18);
                Feedback_updater('TESTBLE',REQUESTING);
                rssidp_count_tries++;
                rssiValueCallback_go_dp(null,true);
              }else{
                if(total_rssi_dp_go!=0){
                  Feedback_updater(spclCategory,REQUESTSUCCESS,parseInt(total_rssi_dp_go/(RSSI_REQ_ITERATIONS-1)));
                }else{
                  Feedback_updater(spclCategory,UNKNOWN_ERROR);
                }
                // activateBtn(true);
              }
            }
            executeTopFunction();
            break;
        case 'UUID_eraseBonds_dp_go':
            if(dataDecoded[7].toString(16)==REQUESTSUCCESS[0].toString(16) && dataDecoded[8].toString(16)==REQUESTSUCCESS[1].toString(16)){
                Feedback_updater(spclCategory,REQUESTSUCCESS);
                // activateBtn(true);
            }else{
                Feedback_updater(spclCategory,UNKNOWN_ERROR);
                // activateBtn(true);
            }
            executeTopFunction();
            break;
        case 'UUID_get_AppletVersion':
		        var opString=String.fromCharCode.apply(null, dataDecoded);
				var length = dataDecoded[6]-2;
				console.log( "length: " + length);

				for (var i=7;i<7+length;i++)
				{
					console.log( dataDecoded[i] + " - ")
				}
                AppletVersion = opString.substr(7,length);
                // vm.constantMsg=false;
                Feedback_updater(spclCategory,REQUESTSUCCESS,AppletVersion);
                executeTopFunction();
				
            //AppletVersion=String.fromCharCode.apply(null, dataDecoded);
            //Feedback_updater(spclCategory,REQUESTSUCCESS,AppletVersion);
            //executeTopFunction();
            break;
        case 'BootLoaderFirmwareVersion':
          // console.log('in boot loader response=');
          // console.log(dataDecoded[2].toString(16))
          // console.log(dataDecoded[3].toString(16))
          // console.log(dataDecoded[4].toString(16))
          // console.log(dataDecoded[5].toString(16))
          if(dataDecoded[2].toString(16)==REQUESTSUCCESS[0].toString(16) && dataDecoded[3].toString(16)==REQUESTSUCCESS[1].toString(16) && dataDecoded[4].toString(16)==0x00 && dataDecoded[5].toString(16)==0x00){
              Feedback_updater(spclCategory,REQUESTSUCCESS);
              console.log('boot loader active');
          }else{
              if(no_firmwareTry<total_firmwareTry){
                Feedback_updater(spclCategory,REQUESTING);
                no_firmwareTry++;
                // console.log('looping boot loader');
                setTimeout(function(){getBootLoaderFirmwareBranch();},100);
              }else{
                // console.log('err boot loader');
                Feedback_updater(spclCategory,UNKNOWN_ERROR);
              }
          }
          //console.log('exec func');
          //console.log(funcToExec);
          executeTopFunction();
          break;
        case 'SetUpdateCommand':
            Feedback_updater(spclCategory,REQUESTSUCCESS);
            break;
        case 'UpdatingFirmwareVersion':
          // console.log('up respo=');
          // console.log(firmIdx+"<"+firmware_file_size / FIRMWARE_BLOCK_SIZE);
          if(firmIdx <= firmware_file_size / FIRMWARE_BLOCK_SIZE){
            // console.log('çalling update');
            startFirmwareUpdate();
          }else{
            // console.log('startong updated app');
            startUpdatedApplication();
          }
          break;
        case 'StartUpdatedApplication':
          // disconnectDevice();
          // console.log('in SC ver info');
          versionDongleCallback();
          break;
        case 'GETDONGLESTATE':
          if(dataDecoded[2].toString(16)==REQUESTSUCCESS[0].toString(16) && dataDecoded[3].toString(16)==REQUESTSUCCESS[1].toString(16))
          {
            no_get_dongle_try++;
            fido_state = dataDecoded[4];
            dfu_state = dataDecoded[5];
            gen_state = dataDecoded[6];
            if (fido_state == 4){
              console.log('------fido_or_dfu=1---------');
                fido_or_dfu = 1;
                executeTopFunction();
            }else if (dfu_state == 7){
              console.log('------fido_or_dfu=2---------');
                fido_or_dfu = 2;
                executeTopFunction();
            }else{
              if(no_get_dongle_try<max_get_dongle_try)
                setTimeout(GetDongleState,1000);
              else
                Feedback_updater(null,DEVICENOTFOUND);
            }
          }else{
              Feedback_updater(null,DEVICENOTFOUND);
          }
		break;
		case 'SetDongleConnectTo':
				console.log("Set Dongle connect to reply");
		break;
        case 'DPGO225_DFU_MODE':
          console.log('got response of dfu');
          payload_length = dataDecoded[5];
          payload_length <<= 8;
          payload_length += dataDecoded[6];
          if (dataDecoded[6 + payload_length - 1] == 0x90 && dataDecoded[6 + payload_length] == 0x00){
            report=new Uint8Array(64);
            report=dataDecoded;
            setTimeout(executeTopFunction,200);
          }
          break;
      }
    }else if(!hideOutput){
      switch(dataDecoded[0])
      {
        case GETRSSI : 
          if(dataDecoded[2].toString(16)==REQUESTSUCCESS[0].toString(16) && dataDecoded[3].toString(16)==REQUESTSUCCESS[1].toString(16)){
            if(rssi_count_tries<RSSI_REQ_ITERATIONS && total_rssi_dongle.length<10){
              var dv = new DataView(dataDecoded.buffer, 0);
              var rssiVal=dv.getInt8(4);
              if(rssiVal!=0){
                total_rssi_dongle.push(rssiVal);
              }
              Feedback_updater('TESTBLE',REQUESTING);
              rssi_count_tries++;
              getRssiValue();
            }else{
              if(total_rssi_dongle.length>0){
                Feedback_updater(GETRSSI,REQUESTSUCCESS,getAverageRssiDongleVal(total_rssi_dongle));
                rssiValueCallback_go_dp();
              }else if(firstTime){
                Feedback_updater('TESTBLE',REQUESTING);
                rssi_count_tries=0;
                firstTime=false;
                setTimeout(getRssiValue,1000);
              }else{
                Feedback_updater(GETRSSI,DEVICENOTFOUND);
              }
            }
          }else{
            Feedback_updater(GETRSSI,DEVICENOTFOUND);
            // activateBtn(false);
          } 
          break;
        case DONGLEVERSION :
          if(dataDecoded[2].toString(16)==REQUESTSUCCESS[0].toString(16) && dataDecoded[3].toString(16)==REQUESTSUCCESS[1].toString(16)){
            var data=readDataFromPayload(dataDecoded);
            Feedback_updater(DONGLEVERSION,REQUESTSUCCESS,data);
          }else{
            Feedback_updater(DONGLEVERSION,UNKNOWN_ERROR);
          } 
          break;
      case ADDNEWBONDS : 
        if(dataDecoded[2].toString(16)==ADDNEWBONDTIMEOUT[0].toString(16) && dataDecoded[3].toString(16)==ADDNEWBONDTIMEOUT[1].toString(16)){
          // Feedback_updater(ADDNEWBONDS,ADDNEWBONDTIMEOUT);
          if(no_of_newbondTry<total_newbondTry){
            Feedback_updater(ADDNEWBONDS,REQUESTING);
            no_of_newbondTry++;
            setTimeout(function(){
              //console.log('retry new bond');
              addNewBondCallback(null,true);},1000);
          }else{
            Feedback_updater(ADDNEWBONDS,ADDNEWBONDTIMEOUT);
              //console.log(' bond not found');
          }
        }else if(dataDecoded[2].toString(16)==ADDNEWBONDSALREADYBOND[0].toString(16) && dataDecoded[3].toString(16)==ADDNEWBONDSALREADYBOND[1].toString(16)){
          // console.log('----------------in new bond response---------------')
            Feedback_updater(ADDNEWBONDS,ADDNEWBONDSALREADYBOND,data);
			//activateBtn(false);
        }else if(dataDecoded[2].toString(16)==ADDNEWBONDSTOMUCHBONDS[0].toString(16) && dataDecoded[3].toString(16)==ADDNEWBONDSTOMUCHBONDS[1].toString(16)){
          // console.log('----------------in new bond response---------------')
            Feedback_updater(ADDNEWBONDS,ADDNEWBONDSTOMUCHBONDS,data);
			//activateBtn(false);			
        }else if(dataDecoded[2].toString(16)==ADDNEWBONDSFOUNDNEW[0].toString(16) && dataDecoded[3].toString(16)==ADDNEWBONDSFOUNDNEW[1].toString(16)){
          Feedback_updater(ADDNEWBONDS,ADDNEWBONDSFOUNDNEW,data);
		    setTimeout(function(){
            //console.log('adding to list');
            addFidoDeviceToList();},1000);
        }else if(dataDecoded[2].toString(16)==ADDNEWBONDSPAIRINGCODESHOW[0].toString(16) && dataDecoded[3].toString(16)==ADDNEWBONDSPAIRINGCODESHOW[1].toString(16)){
		  var data;
		  data = dataDecoded[4];
		  data = data<<8;
		  data += dataDecoded[5];
		  data = data<<8;
		  data+= dataDecoded[6];
		  data = data<<8;
		  data += dataDecoded[7];
		  console.log("Pairing code send by dongle: " + data);
          Feedback_updater(ADDNEWBONDS,ADDNEWBONDSPAIRINGCODESHOW,data);
		  setTimeout(function(){
			//console.log('retry new bond');
				addNewBondCallback(null,true);},1000);
		}else if(dataDecoded[2].toString(16)==ADDNEWBONDSWRONGPIN[0].toString(16) && dataDecoded[3].toString(16)==ADDNEWBONDSWRONGPIN[1].toString(16)){
          Feedback_updater(ADDNEWBONDS,ADDNEWBONDSWRONGPIN,data);
		}else if(dataDecoded[2].toString(16)==ADDNEWBONDFAIL[0].toString(16) && dataDecoded[3].toString(16)==ADDNEWBONDFAIL[1].toString(16)){			
          Feedback_updater(ADDNEWBONDS,ADDNEWBONDFAIL,data);			
		}else if(dataDecoded[2].toString(16)==ADDNEWBONDSREQUESTPIN[0].toString(16) && dataDecoded[3].toString(16)==ADDNEWBONDSREQUESTPIN[1].toString(16)){							//bta
			Feedback_updater(ADDNEWBONDS,ADDNEWBONDSREQUESTPIN,data);
			bootbox.prompt({
					title: chrome.i18n.getMessage("PinRequest"),
					value: "000000",
					inputType: "password",
					callback: function(result) {
						if (result == null) {
							//sendPairingCode(0);
							funcToExec=[];	
							deActivateMsgDirect();						
							} else {
							sendPairingCode(result);
							setTimeout(function(){
									//console.log('retry new bond');
								addNewBondCallback(null,true);},20);
						}
					}
			});
			/*setTimeout(function(){
            //console.log('adding to list');
            Feedback_updater(ADDNEWBONDS,ADDNEWBONDADDED,data);},2000);																																															//bta*/
        }else if(dataDecoded[0] == ADDNEWBONDS && dataDecoded[2].toString(16)==REQUESTSUCCESS[0].toString(16) && dataDecoded[3].toString(16)==REQUESTSUCCESS[1].toString(16)){
          // console.log('----------------in new bond response---------------')
          if(fromNewBond){
            Feedback_updater(ADDNEWBONDS,ADDNEWBONDADDED,data);
              //console.log('succ resp newly added');
          }
          else{
            Feedback_updater(ADDNEWBONDS,ADDNEWBONDSALREADYBOND,data);
              //console.log('succ resp');
          }
          //activateBtn(false);
        }else{
          if(no_of_newbondTry<total_newbondTry){
            Feedback_updater(ADDNEWBONDS,REQUESTING);
            no_of_newbondTry++;
            setTimeout(function(){
              //console.log('new bond else');
              addNewBondCallback(null,true);},1000);
          }else{
              //console.log('new bond dev not found');
            Feedback_updater(ADDNEWBONDS,ADDNEWBONDTIMEOUT);
            // Feedback_updater(ADDNEWBONDS,DEVICENOTFOUND);
          }
        }
        break;
        case ERASEBONDS : 
          Feedback_updater(ERASEBONDS,REQUESTSUCCESS,data);
          //activateBtn(false);
          executeTopFunction();
          break;
        
        case BROADCAST_CID[0]:
          connection_cid=new Uint8Array(4);
          connection_cid[0]=dataDecoded[15];
          connection_cid[1]=dataDecoded[16];
          connection_cid[2]=dataDecoded[17];
          connection_cid[3]=dataDecoded[18];
          executeTopFunction();
          break;
      }
    }
  }

  function addFidoDeviceToList(){
    if(reusableReport)
      reusableReport[0]=ADDNEWBONDS;
    else{
      reusableReport=new Uint8Array(64);
      reusableReport[0]=ADDNEWBONDS;
    }
    sendByteData(false,reusableReport,function(){
      //console.log('success got!')
      // deActivateMsg();
    },connectionId);
  }
  
  function sendPairingCode(pin){									//bta
    if(reusableReport)
	{
      reusableReport[0]=SET_PAIRINGCODE;
	}
	var intPin = Number(pin);
	console.log("Pin: " + intPin);

	reusableReport[1]= 6;
	reusableReport[2]= (intPin >> 24) & 0xff;
	reusableReport[3]= (intPin >> 16) & 0xff;
	reusableReport[4]= (intPin >> 08) & 0xff;
	reusableReport[5]= (intPin >> 00) & 0xff;

    sendByteData(false,reusableReport,function(){
      //console.log('success got!')
      // deActivateMsg();
    },connectionId);
  }
  
    function SetDongleConnectTo(connect_value){
    console.log('SetDongleConnectTo command: ' + connect_value );					//bta
    if(reusableReport)
	{
      reusableReport[0]=MI_CONNECT_TO;
	  reusableReport[1]=3;
	  reusableReport[2]=connect_value;
	}
    else{
	  reusableReport=new Uint8Array(64);
      reusableReport[0]=MI_CONNECT_TO;
	  reusableReport[1]=3;
	  reusableReport[2]=connect_value;    
	  }
    no_connectReq=0;
    sendByteData(true,reusableReport,null,connectionId_FIDO_FIDO,'GETDONGLESTATE')
  }

  function deActivateMsg(isFido,noDisconnect){
    console.log('deActivateMsg func');
    deactivateMsgTimer=setTimeout(function(){
		console.log('start digest');
		$scope.$evalAsync(function(){        
        console.log('clearing var vm');
        if(reInitDivStyle){
          vm.showOutputMessage=false;
          vm.constantMsg=false;
	      activateBtn(isFido,noDisconnect);
        }
		document.getElementById('feedback').style.height = '0px';
		document.getElementById('feedback_picture').src = "";											//clear feedback image
		if(advanced == true)
		{
			document.getElementById('changeUImode').src = "Images/adv_min.png";
			document.getElementById('changeUImode').style.marginTop = "0px";
		}
		else
		{
			document.getElementById('changeUImode').src = "Images/adv_plus.png";
			document.getElementById('changeUImode').style.marginTop = "0px";
		}
      }	  
	  )
    },30000);
    reInitDivStyle=true;
  }
  
    function deActivateMsgDirect(isFido,noDisconnect){
    console.log('deActivateMsg func');
	$scope.$evalAsync(function(){        
        console.log('clearing var vm');
        if(reInitDivStyle){
          vm.showOutputMessage=false;
          vm.constantMsg=false;
	      activateBtn(isFido,noDisconnect);
        }
		document.getElementById('feedback').style.height = '0px';
		document.getElementById('feedback_picture').src = "";											//clear feedback image
		if(advanced == true)
		{
			document.getElementById('changeUImode').src = "Images/adv_min.png";
			document.getElementById('changeUImode').style.marginTop = "0px";
		}
		else
		{
			document.getElementById('changeUImode').src = "Images/adv_plus.png";
			document.getElementById('changeUImode').style.marginTop = "0px";
		}
    });	  
    reInitDivStyle=true;
  }
  
  //update GUI message
  function Feedback_updater(cmd,result,output,hideOutput){
	if( result != 'ApplicationInfo')								//can be called if the gui is busy
	{	
		if(vm.constantMsg || hideOutput ){
			return;
		}
	}
	if (advanced == true)
	{
		console.log("Feedback window in advanced mode");
		if( document.getElementById('feedback').style.height != '240px')
		{
			document.getElementById('feedback').style.height = '240px';
			document.getElementById('feedback_picture').style.height = '200px'
		}
	}
	else
	{
		console.log("Feedback window in basic mode");
		if( document.getElementById('feedback').style.height != '120px')
		{
			document.getElementById('feedback').style.height = '120px';
			document.getElementById('feedback_picture').style.height = '80px'		
		}
	}
	
    switch(result){
      /*case 'NoFileSelectedBLE':
        appendTextToOutput('No file selected, select the update file if you want to update your Bluetooth Bridge.');
        break;
      break;
      case 'NoFileSelectedSC':
        appendTextToOutput('No file selected, select the update file if you want to update your SecureClick.');
        break;
      break;*/
      case REQUESTSUCCESS:
        switch(cmd){
          case 'UUID_FIRMW_VERS':
            firmwareOutput=chrome.i18n.getMessage("BLE_FirmFeedback") + output +"<br/>";
            //appendTextToOutput(appletOutput+" "+firmwareOutput+" "+batteryOutputTxt);
            break;
          case 'UUID_BAT_LVL':
  			document.getElementById('feedback_picture').src = "Images/ble_dev_info.png";											//clear feedback image
            vm.constantMsg=true;
            batteryOutputTxt= chrome.i18n.getMessage("BLE_BatteryLevelFeedback") + output + '%<br/>'
            appendTextToOutput(appletOutput+" "+firmwareOutput+" "+batteryOutputTxt);						//output the text
            deActivateMsg(true);
            break;
          case 'UUID_getRSSI_dp_go':
            vm.constantMsg=true;
            appendTextToOutput(BBRssiOutput + chrome.i18n.getMessage("BLE_RSSI") + output + "dB.<br/>");
            console.log('rssi deacti')
            deActivateMsg(true);
            break;
          case 'UUID_eraseBonds_dp_go':
            vm.constantMsg=true;
			document.getElementById('feedback_picture').src = "Images/ble_dev_active.png";											//clear feedback image
            appendTextToOutput(chrome.i18n.getMessage("BLE_bond_remove_Feedback"));
            deActivateMsg(true);
            break;
          case 'UUID_get_AppletVersion':
            appletOutput=chrome.i18n.getMessage("BLE_AppletFeedback") + output +"<br/>";
            break;
          case GETRSSI:
            BBRssiOutput=chrome.i18n.getMessage("BRIDGE_RSSI") + output + "dB.<br/>";
            break;
          case DONGLEVERSION:
   			document.getElementById('feedback_picture').src = "";														//clear feedback image
            vm.constantMsg=true;
            if(newAppStarted)
              appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Update_Feedback") + output);
            else
              appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Version_Feedback") + output);
   			  document.getElementById('feedback_picture').src = "Images/dp_bb_info.png";								//clear feedback image
			  deActivateMsg();
            break;
          case ERASEBONDS:
			document.getElementById('feedback_picture').style.height = '150px'
   			document.getElementById('feedback_picture').src = "Images/erase_dp_bb_pairings.png";						//clear feedback image
            vm.constantMsg=true;
            appendTextToOutput(chrome.i18n.getMessage("BRIDGE_bond_remove_Feedback"));
            deActivateMsg(true);
            break;
          case 'SetUpdateCommand':
   			document.getElementById('feedback_picture').src = "";														//clear feedback image
            appendTextToOutput(chrome.i18n.getMessage("BLE_send_update_cmd"));
            checkactiveBootLoader();
            break;
          case 'BootLoaderFirmwareVersion':
            setTimeout(function(){
              console.log('Starting firmware update');
			  firmIdx = 0;
              startFirmwareUpdate();
            },1000)
            break;
        }
      break;
      case DEVICENOTFOUND:
        vm.constantMsg=true;
		document.getElementById('feedback_picture').src = "";															//clear feedback image
        switch(cmd){
          case ADDNEWBONDS:
              appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Error_Pairing"));
              break;
          case GETRSSI:
              appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Error_Request"));
              break;
          case CONNECTDEVICE:
            appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Error_Connection"));
            break;
          default:
              appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Lost_Connection"));
              break;
        }
        console.log('common deacti');
        deActivateMsg();
      break;
      case REQUESTING:
        switch(cmd){
          case 'eraseBondFIDO':
            appendTextToOutput(chrome.i18n.getMessage("BLE_Remove_pairings_cmd"));
            break;
          case 'eraseBondDongle':
            appendTextToOutput(chrome.i18n.getMessage("BLE_Remove_pairings_progress"));
            break;
          case 'TESTBLE':
            appendTextToOutput(chrome.i18n.getMessage("BRIDGE_RSSI_REQUEST"));
            break;
          case 'UUID_FIRMW_VERS':
            appendTextToOutput(chrome.i18n.getMessage("BLE_info_request"));
            break;
          case 'versionDongle':
            appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Version_Progress"));
            break;
          case 'UUID_getRSSI_dp_go':
            appendTextToOutput(chrome.i18n.getMessage("BLE_RSSI_Request"));
            break; 
          case GETRSSI:
            appendTextToOutput(chrome.i18n.getMessage("BLE_RSSI_Progress"));
            break; 
          case ADDNEWBONDS:
            appendTextToOutput(chrome.i18n.getMessage("BLE_pairing_request"));
            break; 
          case CONNECTDEVICE:
            appendTextToOutput(chrome.i18n.getMessage("BLE_connection_progress"));
            break; 
          default:
            appendTextToOutput(chrome.i18n.getMessage("BRIDGE_waiting"));
            break; 
        }
      break;
      /*case 'defaultText':
        switch(cmd){
          case 'addNewBond':
            appendTextToOutput("This function enables you to add a new SecureClick to the Bluetooth Bridge bonds list. Follow the instructions which show up on the screen.");
            break;
          case 'testRSSI':
            appendTextToOutput("This function lets you check the link between a SecureClick and the Bluetooth Bridge.");
            break;
          case 'eraseBondDongle':
            appendTextToOutput("This function erases all bonds with SecureClicks you previously used with Bluetooth Bridge.");
            break;
          case 'eraseBondFIDO':
            appendTextToOutput("This function lets you erase the bonds of the SecureClick. Push the button on your SecureClick.");
            break;
          case 'checkVersionDongle':
            appendTextToOutput("This function lets you request the Bluetooth Bridge firmware version.");
            break;
          case 'checkVersionFIDO':
            appendTextToOutput("This function enables you to request information about the SecureClick. Push the button on your SecureClick.");
            break;
          case 'updateVersionDongle':
            appendTextToOutput("This function enables you to update the firmware of the Bluetooth Bridge. Follow the instructions which show up on the screen.");
            break;
          case 'updateVersionFIDO':	  
            appendTextToOutput("This function enables you to update the firmware of the SecureClick. Follow the instructions which show up on the screen.");
            break;
        }
        break;*/
      case ADDNEWBONDADDED:
        vm.constantMsg=true;
		document.getElementById('feedback_picture').src = "Images/ble_dev_active.png";									//clear feedback image
        appendTextToOutput(chrome.i18n.getMessage("BLE_Adding_Succes"));
        deActivateMsg();
        break;
      case ADDNEWBONDSALREADYBOND:
        vm.constantMsg=true;
		document.getElementById('feedback_picture').src = "";															//clear feedback image
        appendTextToOutput(chrome.i18n.getMessage("BLE_Already_Paired"));
        deActivateMsg();
        break;
      case ADDNEWBONDSTOMUCHBONDS:
        vm.constantMsg=true;
		document.getElementById('feedback_picture').src = "";															//clear feedback image
        appendTextToOutput(chrome.i18n.getMessage("DONGLE_to_much_bonds"));
        deActivateMsg();
      break;
      case ADDNEWBONDSFOUNDNEW:
        // vm.constantMsg=true;
        fromNewBond=true;
        appendTextToOutput(chrome.i18n.getMessage("BLE_Adding_bond_Progress"));
        // deActivateMsg();
        break;
	  case ADDNEWBONDSREQUESTPIN:
		appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Send_Pin"));
		break;
	  case ADDNEWBONDSPAIRINGCODESHOW:
        appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Show_Pin") + output);
        break;
	  case ADDNEWBONDFAIL:
		appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Failed_Pairing"));
        vm.constantMsg=true;
        deActivateMsg();
		break;
	  case ADDNEWBONDSWRONGPIN:
		appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Wrong_Pin"));
		console.log("Wrong pin");
        vm.constantMsg=true;
        deActivateMsg();
		break;
      case ADDNEWBONDTIMEOUT:
        appendTextToOutput(chrome.i18n.getMessage("BLE_Timeout"));
        vm.constantMsg=true;
        deActivateMsg();
        break;
      case UNKNOWN_ERROR:
        appendTextToOutput(chrome.i18n.getMessage("BLE_Unknown_Error"));
        vm.constantMsg=true;
        console.log('unkno err deacti');
		DisconnectFromBLE();
        deActivateMsg();
        break;
      case DEVICECONNECTED:
        appendTextToOutput(chrome.i18n.getMessage("BRIDGE_connected"));
        break;
      case FRIMWAREUPDATE:
        appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Start_Update"));
			document.getElementById('update').style.height = '0px';					//always in advanced mode
			document.getElementById('updateVersionDongle').style.height = '0px';
			document.getElementById('updateVersionFIDO').style.height = '0px';
			document.getElementById('updateVersionDongle_label').style.height = '0px';
			document.getElementById('updateVersionDongle_label').style.visibility = 'hidden';
			document.getElementById('updateVersionFIDO_label').style.visibility = 'hidden';				//clear feedback image		
			document.getElementById('feedback_picture').src = "Images/dp_bb_updating.png";
        break;
      case 'FRIMWAREUPDATEPROGRESS':
        appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Update_Progress") + output + "%");	
        break;
      case 'FIDOFRIMWAREUPDATEPROGRESS':
		if( output == "0")
		{
			document.getElementById('feedback_picture').src = "Images/DP-GO225-dfu-animated_fast.gif";											//clear feedback image		
		}
        appendTextToOutput(chrome.i18n.getMessage("BLE_Update_Progress") + output + "%).");
        break;
      case 'ACTIVATINGFIRMWAREDONE':
        appendTextToOutput(chrome.i18n.getMessage("BLE_Update_Success"));
		document.getElementById('feedback_picture').src = "Images/success_ble_dev.png";
		deActivateMsg();
        break;
      case 'FIDOFRIMWAREUPDATEWAITNOTIOFICATION':
        appendTextToOutput(chrome.i18n.getMessage("BLE_Validity_Check"));
        break;
      case 'ACTIVATINGFIRMWARE':
        appendTextToOutput(chrome.i18n.getMessage("BLE_Activate_Firmware"));
        break;
      case 'UPDATEFIDOFIRMWAREINIT':
        appendTextToOutput(chrome.i18n.getMessage("BLE_Update_Request"));
		document.getElementById('update').style.height = '0px';					//always in advanced mode
		document.getElementById('updateVersionDongle').style.height = '0px';
		document.getElementById('updateVersionFIDO').style.height = '0px';
		document.getElementById('updateVersionDongle_label').style.visibility = 'hidden';
		document.getElementById('updateVersionFIDO_label').style.visibility = 'hidden';			
		document.getElementById('feedback_picture').src = "Images/DP-GO225-on-animated-small.gif";											//clear feedback image		
        break;
      case 'GETDFUMODE':
        appendTextToOutput(chrome.i18n.getMessage("BLE_Connection_Progress"));
        break;
      case 'STARTSECURECLICKUPDATE':
        appendTextToOutput(chrome.i18n.getMessage("BLE_Update_Request"));
        break;
      case 'INITFIDOTRANSFER':
        appendTextToOutput(chrome.i18n.getMessage("BLE_Firmware_Start_Progress"));
		document.getElementById('feedback_picture').src = "Images/ble_dev_dfu.png";
		document.getElementById('updateVersionDongle_label').style.visibility = 'hidden';
		document.getElementById('updateVersionFIDO_label').style.visibility = 'hidden';	
        break;
      case 'CHROMEEXCEPTION':
        appendTextToOutput(chrome.i18n.getMessage("BLE_Lost_Connection"));
        break;
	  case 'TOMANYDONGLES':
        appendTextToOutput(chrome.i18n.getMessage("BRIDGE_To_Many_Feedback"));
      break;
      case 'SELECTUPDATEFILE':
        appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Select_File"));
        break;
	  case 'ApplicationInfo':
	    vm.constantMsg=true;
		appendTextToOutput('<p align="left" style="padding-left: 20px">Version ' + chrome.runtime.getManifest().version + '<br><a href="' + chrome.i18n.getMessage("user_manual") +'" target="_blank" style="padding-left: 20px">USER manual</a><br><a href="' + chrome.i18n.getMessage("License_Agreement") +'" style="padding-left: 20px" target="_blank">Terms and license agreement</a><br><font size="2">' + chrome.i18n.getMessage("Copyright") + '</font></align>');						//output the text
		document.getElementById('feedback_picture').src = "";
	    funcToExec=[];
		//document.getElementById('feedback_picture').src = "Images/vasco_logo.png";
		deActivateMsg();
		break;
	  case 'DFUcheckSignature': 
	    appendTextToOutput(chrome.i18n.getMessage("BLE_Check_Sign"));
		document.getElementById('feedback_picture').src = "Images/DP-GO225-dfu-animated_slow.gif";
		document.getElementById('updateVersionDongle_label').style.visibility = 'hidden';
		document.getElementById('updateVersionFIDO_label').style.visibility = 'hidden';
		break;
      default:
        appendTextToOutput(chrome.i18n.getMessage("BRIDGE_Waiting"));
        break;
    }
  }

  //get average value from RSSI
  function getAverageRssiDongleVal(RssiArray){
    if(RssiArray && RssiArray.length && RssiArray.length>0){
      var sum=0;
      for(var i=0;i<RssiArray.length;i++){
        sum+=RssiArray[i];
      }
      return(parseInt(sum/RssiArray.length));
    }else{
      return(0);
    }
  }

  //read data processing payload
  function readDataFromPayload(dataDecoded){
    var length=parseInt(dataDecoded[1].toString(10))-2;
    var outputPayload='';
    for(var i=0;i<length+1;i++){
      outputPayload+=dataDecoded[4+i].toString(10)+".";
    }
    return(outputPayload);
  }

  //append output to GUI window
  function appendTextToOutput(msg,sameline){
    vm.showOutputMessage=true;
    //console.log(msg);
    if(sameline){
      $scope.$evalAsync(function (){vm.outputMessage=$sce.trustAsHtml(vm.outputMessage+" "+msg);});
    }else{
      $scope.$evalAsync(function(){vm.outputMessage=$sce.trustAsHtml(msg);});
    }
  }

  //update firmware command incomplete
  function updateDongleFirmware(){
    Feedback_updater(FRIMWAREUPDATE);
  }

  //clear output message
  function clearOutputMsg(){
    if(!vm.constantMsg)
      vm.outputMessage="";
  }
  //functions for Dongle and Fido specific commands --end

  function startUpdatedApplication(){
      newAppStarted=true;
      report=new Uint8Array(64);
      report[0]=FRIMWAREUPDATE;
      report[1]=START_APP;
      report[2]=START_APP;
      report[3]=FIRMWARE_BLOCK_SIZE / 4;
      var callback=function(){
        disconnectDevice();
        setTimeout(function(){
          console.log('in callback ver info');
          versionDongleCallback();
        },4000)
      }
      console.log('sending StartUpdatedApplication bytes');
      sendByteData(false,report,callback,connectionId,'StartUpdatedApplication',false,true); 
    // } 
  }

  function startFirmwareUpdate(){
	if( (vm.showOutputMessage==true) || (vm.constantMsg == true) )			//dont run if canceled
	{
		setTimeout(function(){
		  // console.log('in update func');
		  console.log("firmidx");
		  console.log(firmIdx);
		  report = new Uint8Array(64);
		  report[0] = FRIMWAREUPDATE;
		  report[1] = (((firmIdx * FIRMWARE_BLOCK_SIZE) / 4) / 256);
		  report[2] = (((firmIdx * FIRMWARE_BLOCK_SIZE) / 4) % 256);
		  report[3] = FIRMWARE_BLOCK_SIZE / 4;
		  // Add the firmware data to the payload of the report                    
		  var subreport = new Uint8Array(64);
		  for(var j=0;j<FIRMWARE_BLOCK_SIZE;j++){
			 report[4+j]=FirmwareFileData[firmIdx*FIRMWARE_BLOCK_SIZE+j];
		  }
		  progress = (firmIdx * 100) / (firmware_file_size / FIRMWARE_BLOCK_SIZE);
		  firmIdx++;
		  sendByteData(false,report,null,connectionId,'UpdatingFirmwareVersion');
		  Feedback_updater(null,'FRIMWAREUPDATEPROGRESS',parseInt(progress));
		},10)
	}
  }

  function getBootLoaderFirmwareBranch(){
    console.log('in boot loader');
    var report=new Uint8Array(64);
    report[0]=DONGLEVERSION;
    no_firmwareTry++;
    setTimeout(function(){
      console.log('again waited for 500ms')
      sendByteData(false,report,null,connectionId,'BootLoaderFirmwareVersion');
    },500)
  }

  function setUpdateCommand(){
    console.log('set update command called');
    var report=new Uint8Array(64);
    report[0]=FRIMWAREUPDATE;
    var callback=function(){
      disconnectDevice();
      console.log('disconnect dev');
      setTimeout(function(){
        console.log('waiting for 500ms for bootloader');
        checkactiveBootLoader();
      },2000)
    }
    //console.log('sending 0x0d');
    sendByteData(false,report,callback,connectionId,'SetUpdateCommand',null,true)
  }

  function checkactiveBootLoader(){
    console.log('in check bootloader')
    no_connectReq=0;
    funcToExec.unshift(getBootLoaderFirmwareBranch);
    connectToDevice(false,executeTopFunction);
  }

  $("#fileUploadCtrl").on('change',fileuploadChange);
  $("#fileUploadCtrl").on('click',resetValue);
  $("#DPGOfileUploadCtrl").on('change',FidoFileuploadChange);
  $("#DPGOfileUploadCtrl").on('click',resetValue);
  // $("#DPGOfileUploadCtrl").on('blur',function(){
    // console.log('cancel event');
  // });

  function resetValue(){
    console.log('in reset');
    vm.showOutputMessage=true;
    this.value=null;
  }

  function fileuploadChange(e){
    console.log('on change trigger');
    Feedback_updater(null,FRIMWAREUPDATE);
    if(this.files && this.files.length>0){
      initFunctionalityClick('updateVersionDongle');
      //console.log('file upload tset triggered------');
      var file=this.files[0];
      var reader  = new FileReader();
      reader.addEventListener("load", function () {
        //console.log('final result=');
        FirmwareFileData=new Uint8Array(reader.result);
        console.log('got data');
        firmware_file_size=FirmwareFileData.length;
        console.log('size='+firmware_file_size);
        no_connectReq=0;
        rssidp_count_tries=0;
        total_rssi_dp_go=0;
        no_firmwareTry=0;
        funcToExec.unshift(setUpdateCommand);
        // funcToExec.unshift(checkactiveBootLoader);
        connectToDevice(false,executeTopFunction, false,null,'dongleUpdate');
      });
      if (file) {
          reader.readAsArrayBuffer(file);
      }
    }
  }

  //zip file code
  var requestFileSystem = window.webkitRequestFileSystem || window.mozRequestFileSystem || window.requestFileSystem;
  function createTempFile(callback) {
    var tmpFilename = "tmp.dat";
    requestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024, function(filesystem) {
      function create() {
        filesystem.root.getFile(tmpFilename, {
          create : true
        }, function(zipFile) {
          callback(zipFile);
        });
      }

      filesystem.root.getFile(tmpFilename, null, function(entry) {
        entry.remove(create, create);
      }, create);
    });
  }

  var model = (function() {
    var URL = window.webkitURL || window.mozURL || window.URL;

    return {
      getEntries : function(file, onend) {
        zip.createReader(new zip.BlobReader(file), function(zipReader) {
          zipReader.getEntries(onend);
        }, onerror);
      },
      getEntryFile : function(entry, creationMethod, onend, onprogress) {
        var writer, zipFileEntry;

        function getData() {
          entry.getData(writer, function(blob) {
            var blobURL = creationMethod == "Blob" ? URL.createObjectURL(blob) : zipFileEntry.toURL();
            onend(blobURL);
          }, onprogress);
        }

        if (creationMethod == "Blob") {
          writer = new zip.BlobWriter();
          getData();
        } else {
          createTempFile(function(fileEntry) {
            zipFileEntry = fileEntry;
            writer = new zip.FileWriter(zipFileEntry);
            getData();
          });
        }
      }
    };
  })();

  function download(entry, li, a) {
    model.getEntryFile(entry, creationMethodInput.value, function(blobURL) {
    }, function(current, total) {
      unzipProgress.value = current;
      unzipProgress.max = total;
    });
  }
var bin_fs = null;									// data of the binary file
var dat_fs =  null;									// data of the dat file
var manifest_fs =  null;							// data of the manifest file
var bin_fs_File = null;
var dat_fs_File =  null;
var manifest_fs_File =  null;
var bin_fs_size=0;
  function FidoFileuploadChange(e){										// start dfu update
    if(this.files && this.files.length>0){
      initFunctionalityClick('updateVersionFIDO');
      manifest_fs=null;		
      bin_fs=null;
      dat_fs=null;
      var file=this.files[0];
      model.getEntries(file, function(entries) {
        entries.forEach(function(entry) {
          if(entry.filename.indexOf('.bin')!=-1){						// the firmware file
            bin_fs_File = entry;
          }else if(entry.filename.indexOf('.dat')!=-1){					// the firmware init packet
            dat_fs_File = entry;
          }else if(entry.filename.indexOf('.json')!=-1){				// description of the firmware zip file
            manifest_fs_File = entry;
          }
        });
		
        manifest_fs_File.getData(new zip.TextWriter(),function(text){				
			manifest_fs=text;
          });
		  
        bin_fs_File.getData(new zip.BlobWriter(),function(blob){
            var readerBin = new FileReader();
            readerBin.addEventListener("loadend", function() {
               // reader.result contains the contents of blob as a typed array
              bin_fs=new Uint8Array(readerBin.result);
              bin_fs_size=bin_fs.length;
              console.log(bin_fs_size/20);
              startUpdateFidoFirmware();											// this function will be called if the 'loadend' signal is received
            });																		// because you don't know if the bin or dat file is first, you do this in both functions
            readerBin.readAsArrayBuffer(blob);
          });
		  
        dat_fs_File.getData(new zip.BlobWriter(),function(blob){
            var reader = new FileReader();
            reader.addEventListener("loadend", function() {
              dat_fs=new Uint8Array(reader.result);
              startUpdateFidoFirmware();
            });
            reader.readAsArrayBuffer(blob);
          });
      });
    }
  }

  function checkIfWordPresent(wordToFind,TextString){
    return new RegExp("\\b" + wordToFind + "\\b").test(TextString)
  }

  function startUpdateFidoFirmware(){
    if(manifest_fs && bin_fs && dat_fs){								// all the files are detected
      if(checkIfWordPresent('application',manifest_fs))					// zip contains an application
        dfu_contains=4;	
      if(checkIfWordPresent('bootloader',manifest_fs))					// zip contains a bootloader
        dfu_contains=2;
      if(checkIfWordPresent('softdevice',manifest_fs))					// zip contains a softdevice
        dfu_contains=1;
      Feedback_updater(null,'UPDATEFIDOFIRMWAREINIT');
      fido_or_dfu=0;
      no_get_dongle_try=0;
      console.log('calling GetDongleState');
	  SetDongleConnectTo(CONNECT_TO_DFU_DEVICE + CONNECT_TO_UNKNOWN_DFU_DEVICE);						//TODO make this as funcToExec function
      setTimeout(function(){
        GetDongleState();
        funcToExec.unshift(afterGetDongleState);
      },100);
    }
  }

  function afterGetDongleState(){
      switch(fido_or_dfu){
        case 0:
          console.log('*************no dev found case 0')
          Feedback_updater(null,DEVICENOTFOUND);
          break;
        case 1:
          console.log('****************change to dfu case 1')
          changeToDFUmode();
          break;
        case 2:
          console.log('****************already in dfu 2')
          alreadyInDFU();
          break;
        default:
          if(dfu_state<2)
            Feedback_updater(null,DEVICENOTFOUND);
          break;
      }
  }

  function alreadyInDFU(){
    transferFidoFrmIdx=0;
    contLoop=true;
    dfuFound=false;
    console.log('Already in DFU, try to connect and start');
    // funcToExec.unshift(transferFIDOFirmwareData);
    // connectToDevice(true,executeTopFunction,null,null,'STARTSECURECLICKUPDATE');
    transferFIDOFirmwareData();
  }

  function changeToDFUmode(){
    Feedback_updater(null,'STARTSECURECLICKUPDATE');
    console.log('Get this device into dfu mode');
	no_connectReq = 0;
    funcToExec.unshift(allocateCid);
    funcToExec.unshift(
	  function(){
        setTimeout(GO225_dfu_mode,200);
      });
    transferFidoFrmIdx=0;
    contLoop=true;
    funcToExec.unshift(
      function(){
        console.log('call transferFIDOFirmwareData after 5 sec');
        setTimeout(transferFIDOFirmwareData,5000);
      });
    connectToDevice(true,executeTopFunction,null,null,'STARTSECURECLICKUPDATE');
  }

  function transferFIDOFirmwareData(){
    console.log('Send dfu init packet 0x01 0x04');
    Feedback_updater(null,'INITFIDOTRANSFER');
    if(transferFidoFrmIdx <40 && contLoop ){
      transferFidoFrmIdx++;
      var uuid = 0x1531;
      var initRequestData=new Uint8Array(64);
      length = 2;
      initRequestData[0] = 0x01;
      initRequestData[1] = dfu_contains;

      console.log('Write uuid of init packet');
      WriteUUID(uuid, length, initRequestData,false ,afterDfuContainSent);
	  
    }else if(transferFidoFrmIdx>=40 && contLoop){
      //close all pointers
      deActivateMsg();
    }else if(dfuFound){
	  console.log("DFU init packet notification received. Send the start of signature");
	  var initGoToSignature = new Uint8Array(64); 
      uuid = 0x1531;
      length = 2;
      initGoToSignature[0] = 0x02;
      initGoToSignature[1] = 0x00;
      var callback=function(){
        setTimeout(postDfuFound,500);
      }
      funcToExec.unshift(callback);
      stopWriteUUID=false;
      WriteUUID(uuid, length, initGoToSignature, false,callback);
    }else{
      ////console.log('in no action transferFIDOFirmwareData');
    }
  }
  var startDfuIdx=0;
var latestNotificationIdx=0;
  function afterDfuContainSent(){
    console.log('Send the application length to dfu');
	var initSizeData=new Uint8Array(64);
    bin_fs_size=bin_fs.length;
    uuid = 0x1532;
    length = 12;
    switch(dfu_contains){
      case 1:
          initSizeData[0] = (bin_fs_size % 256) & 0xff;            //Application length
          initSizeData[1] = ((bin_fs_size >> 8) % 256) & 0xff;   	//
          initSizeData[2] = ((bin_fs_size >> 16) % 256) & 0xff;
          initSizeData[3] = ((bin_fs_size >> 24) % 256) & 0xff;
          break;
      case 2:
          initSizeData[4] = (bin_fs_size % 256) & 0xff;            //Application length
          initSizeData[5] = ((bin_fs_size >> 8) % 256) & 0xff;   	//
          initSizeData[6] = ((bin_fs_size >> 16) % 256) & 0xff;
          initSizeData[7] = ((bin_fs_size >> 24) % 256) & 0xff;
          break;

      case 4:
          initSizeData[8] = (bin_fs_size % 256) & 0xff;            //Application length
          initSizeData[9] = ((bin_fs_size >> 8) % 256) & 0xff;   	//
          initSizeData[10] = ((bin_fs_size >> 16) % 256) & 0xff;
          initSizeData[11] = ((bin_fs_size >> 24) % 256) & 0xff;
          break;
      default:
		  console.log('No valid manifest file')
          // m_objWorker.ReportProgress(-3);
          // manifest_fs.Close();
          // bin_fs.Close();
          // dat_fs.Close();
          return;
    }
    startDfuIdx=0;
    stopLatestNoti=false;
    WriteUUID(uuid, length, initSizeData,false, startDfu);
  }

var dfuReset=false;
	function startDfu(){
    if(startDfuIdx<100 && !dfuFound && !stopLatestNoti){
      startDfuIdx++;
      latestNotification(report,checkIfDFUStarted,false,10);
    }else{
      setTimeout(function(){
        transferFIDOFirmwareData();
      },100);
    }

    function checkIfDFUStarted(){
      var callback=function(){
        setTimeout(startDfu,500);
      }
      if ((report[4] == 0x10) && (report[5] == 0x01) && (report[6] == 0x01))      //wait for the first notification
      {
          dfuFound = true;
          contLoop=false;
          setTimeout(transferFIDOFirmwareData,100);
      }
      else if((report[4] == 0x10) && (report[5] == 0x01) && (report[6] == 0x02 || report[6] == 0x06))					//bta added 0x06 to statement
      {
          if (dfuReset != true)
          {
              uuid = 0x1531;
              length = 1;

              data[0] = 0x06;
              WriteUUID(uuid, length, report,false,callback);
              dfuReset = true;
          }
      }
      else
      {
          callback();
      }

    }
  }

  var dat_fs_pointer=0;
  function postDfuFound(){
    uuid = 0x1532;
   length = 20;
   for(var i=0;i<=20;i++){
    data[i]=dat_fs[dat_fs_pointer++];
   }
   var callback=function(){
    postDfuLoopIdx=0;
    //console.log('start of 16x6 loop');
     setTimeout(postDfuLoop,200);
   }
   funcToExec.unshift(callback);
   WriteUUID(uuid, length, data, false, callback);
  }
  
  function postDfuLoop(){
    if(postDfuLoopIdx<6){
      uuid = 0x1532;
      length = 16;
      dat_fs_pointer--;
      for(var i=0;i<=16;i++)
       data[i]=dat_fs[dat_fs_pointer++];
      postDfuLoopIdx++;
      WriteUUID(uuid, length, data, false, postDfuLoop);
    }else{
      //console.log('---------end of 16x6 loop')
	  dat_fs_pointer = 0;									//clear this pointer
      postDfuFoundInitPacket();
    }
  }

var postDfuFoundCheckSignatureIdx=0;
  function postDfuFoundInitPacket(){
    uuid = 0x1531;
    length = 2;
    data[0] = 0x02;
    data[1] = 0x01;
	Feedback_updater(null,'DFUcheckSignature')
    var callback=function(){
      postDfuFoundCheckSignatureIdx=0;
      postDfuFoundCheckSignatureCont=true;
      setTimeout(postDfuFoundCheckSignature,500);
    }
    funcToExec.unshift(callback);
    WriteUUID(uuid, length, data, false, callback);
  }
var sendFirmwarePacketIdx=0;
var firmwarePacketAmount=0;

var waitForThirdNotificationIdx=0;
var waitForThirdNotificationCont=true;
var bin_fs_pointer=0;

  function postDfuFoundCheckSignature(){
    if(postDfuFoundCheckSignatureIdx<100 && postDfuFoundCheckSignatureCont){
      postDfuFoundCheckSignatureIdx++;
      var calledAfter=function(){
        if ((signData[4] == 0x10) && (signData[5] == 0x02) && (signData[6] == 0x01))
        {
            postDfuFoundCheckSignatureCont=false;
        }
        else if ((signData[4] == 0x10) && (signData[5] == 0x02))
        {
          //console.log('error code -4');
        }
        setTimeout(postDfuFoundCheckSignature,1500);
      }
      stopLatestNoti=false;
      latestNotification(data,calledAfter,false,10);
    }else if(!postDfuFoundCheckSignatureCont){
      uuid = 0x1531;
      length = 1;
      data[0] = 0x03;
      var callback=function(){
        firmwarePacketAmount = (bin_fs_size / 20);
        if ((bin_fs_size % 20) != 0)
        {
            firmwarePacketAmount++;
        }
        bin_fs_pointer=0;
        sendFirmwarePacketIdx=0;
        setTimeout(sendFirmwarePacket,500);
      }
      funcToExec.unshift(callback);
      WriteUUID(uuid, length, data, false, callback);
    }else{
      ////console.log('postDfuFoundCheckSignature no case');
    }
  }
      var notificationSent=false;

  function sendFirmwarePacket(){
    if(bin_fs_pointer<bin_fs_size){
      sendFirmwarePacketIdx++;
      var percentComp=(sendFirmwarePacketIdx * 100) / (bin_fs_size / 20);
      var feedbackStr = chrome.i18n.getMessage("BLE_Firmware_Progress") + (sendFirmwarePacketIdx * 100) / (bin_fs_size / 20) + "%";
      Feedback_updater(null,'FIDOFRIMWAREUPDATEPROGRESS',parseInt(percentComp))
      //console.log(feedbackStr);
      uuid = 0x1532;
      var lengthPending=bin_fs_size-bin_fs_pointer;
      var fs_length=(lengthPending<20)?lengthPending:20;
      for(var i=0;i<fs_length;i++){
        data[i]=bin_fs[bin_fs_pointer++];
      }
      notificationSent=false;
      length = fs_length; //length of 20 bytes i hex is 0x14
      WriteUUID(uuid, length, data, false, postSendFirmwarePacket);
    }else{
      Feedback_updater(null,'FIDOFRIMWAREUPDATEWAITNOTIOFICATION')
      waitForThirdNotificationIdx=0;
      waitForThirdNotificationCont=true;
      //console.log('--------done with firmware sending notif if not sent----------')
      if(!notificationSent){
        var calledAfter=function(){
          if ((report[4] == 0x10) && (report[5] == 0x02) && (report[6] == 0x01))
          {
              //console.log("check ok\n");
          }
          else
          {
            //console.log('something wrong = -4');
          }
          notificationSent=true;
          waitForThirdNotification();
        }
        stopLatestNoti=false;
        latestNotification(data,calledAfter,false,10);
      }else{
          waitForThirdNotification();
      }
    }
  }

  function postSendFirmwarePacket(){
    //console.log('sendFirmwarePacketIdx='+sendFirmwarePacketIdx);
    //console.log('sendFirmwarePacketIdx bool='+((sendFirmwarePacketIdx-1) % 100 == 0));
    if ((sendFirmwarePacketIdx-1) % 500 == 0)                     //check every 500 packets
    {
          //console.log('got into');
          var calledAfter=function(){
            if ((report[4] == 0x10) && (report[5] == 0x02) && (report[6] == 0x01))
            {
                //console.log("check ok\n");
            }
            else
            {
              console.log('something wrong = -4');
            }
            notificationSent=true;
            sendFirmwarePacket();
          }
          stopLatestNoti=false;
          latestNotification(data,calledAfter,false,1);
	}
	else if ((sendFirmwarePacketIdx) % 10 == 0){
		connectionId_FIDO_FIDO = null;									//clear the fido handle
		if( (dfu_state != 7) && (sendFirmwarePacketIdx > 20) )			//not at first time, donglestate can be fido mode 
		{
			console.log('connection lost - ' + sendFirmwarePacketIdx);							//TODO: implement what to do after!!!!!!!!!
			Feedback_updater(null,'CHROMEEXCEPTION');
			deActivateMsg(null,true);
		}
		//sendFirmwarePacket();
		GetDongleState();
	    funcToExec=[];
		funcToExec.unshift(sendFirmwarePacket);
    }else{
        sendFirmwarePacket();
    }
  }

  function waitForThirdNotification(){
	console.log("waitForThirdNotificationIdx: " + waitForThirdNotificationIdx );
    if(waitForThirdNotificationIdx<100 && waitForThirdNotificationCont){
      waitForThirdNotificationIdx++;
      var calledAfter=function(){
        if ((report[4] == 0x10) && (report[5] == 0x03) && (report[6] == 0x01))
        {
            //console.log("\nDfu firmware size send - ok\n");
            waitForThirdNotificationCont=false
        }
        else if ((report[4] == 0x10) && (report[5] == 0x02))
        {
          //console.log('error waitForThirdNotification -4')
        }
        setTimeout(waitForThirdNotification,500);
      }
      stopLatestNoti=false;
      latestNotification(data,calledAfter,false,20);
    }else{
      Feedback_updater(null,'ACTIVATINGFIRMWARE');
      uuid = 0x1531;
     length = 1;
     data[0] = 0x04;
     waitForPostThirdNotificationIdx=0;
     waitForPostThirdNotificationCont=true;
     WriteUUID(uuid, length, data, false,postThirdNotification);
     console.log("Activate new firmware");
    }
  }
  function postThirdNotification(){
    if(waitForPostThirdNotificationIdx<100 && waitForPostThirdNotificationCont){
      waitForPostThirdNotificationIdx++;
      var calledAfter=function(){
        if ((report[4] == 0x10) && (report[5] == 0x04) && (report[6] == 0x01))
        {
            //console.log("\nDfu firmware size send - ok\n");
            waitForPostThirdNotificationCont=false
        }
        else if ((report[4] == 0x10) && (report[5] == 0x02))
        {
          //console.log('error waitForThirdNotification -4');
        }
        setTimeout(postThirdNotification,500);
      }
      stopLatestNoti=false;
      latestNotification(data,calledAfter,false,20);
    }else{
      uuid = 0x1531;
     length = 1;
     data[0] = 0x05;
     var callback=function(){
     	SetDongleConnectTo(0);														//disable connect to DFU
        vm.constantMsg=true;
		Feedback_updater(null,'ACTIVATINGFIRMWAREDONE');
		console.log('in uuid')
        deActivateMsg();
     }
     Feedback_updater(null,'ACTIVATINGFIRMWAREDONE');
     WriteUUID(uuid, length, data, false,callback);
	 
	//bin_fs_File.close();
	//dat_fs_File.close();
	//manifest_fs_File.close();
	//this.file.close();
     //console.log("Activate image and reset\nUpdate succeeded\n");
    }
  }
var clearLatestNotiTimmer=null;
var stopLatestNoti=false;
var LATEST_NOTI=0x15;
  function latestNotification(data,callbackAfterFunc,isRecurssiveCall,NumberOfReads){
    if(stopLatestNoti){
      stopLatestNoti=false;
      return;
    }
    if(isRecurssiveCall){
      latestNotificationIdx++;
    }else{
      latestNotificationIdx=0;
      latestNotificationCont=true;
    }
    if(latestNotificationIdx<NumberOfReads && latestNotificationCont){
      // Add the command of the request to the report
        report[0] = LATEST_NOTI;
        var callback=function(){
          clearLatestNotiTimmer=setTimeout(function(){
            latestNotification(report,callbackAfterFunc,true,NumberOfReads);
          },500);
        }
        sendByteData(false,report,callback,connectionId,'latestNotification')
      }else{
        stopLatestNoti=true;
        while (clearLatestNotiTimmer--) {
            window.clearTimeout(clearLatestNotiTimmer); // will do nothing if no timeout with id is present
        }
        callbackAfterFunc();
      }
   }
var clearLatestNotiTimmer=null;
var LATEST_NOTI=0x15;	
	function singleLatestNotification(data,callbackAfterFunc,isRecurssiveCall){
        report[0] = LATEST_NOTI;
		var callback=function(){
			clearLatestNotiTimmer=setTimeout(function(){
            latestNotification(report,callbackAfterFunc,true,1);
			},100);
		}
        sendByteData(false,report,callback,connectionId,'latestNotification');
        callbackAfterFunc();
    }
	
var clearWriteCallback=null;
var stopWriteUUID=false;
  function WriteUUID(uuidIp,writeLength,dataIp,isRecurssiveCall,finalCallback){
    if(isRecurssiveCall){
      WriteUUIDIdx++;
    }else{
      WriteUUIDIdx=0;
      WriteUUIDCont=true;
      stopWriteUUID=false;
    }
    if(stopWriteUUID){
      stopWriteUUID=false;
      return;
    }
    if(WriteUUIDIdx<20 && WriteUUIDCont){
      // Add the command of the request to the report
        if(!isRecurssiveCall){
          report[0] = 0x13;
          report[1] = (writeLength + 0x02);
          report[2] = ((uuidIp & 0x0000ff00) >> 8);
          report[3] = (uuidIp & 0x000000ff);
          for (i = 0; i < writeLength; i++)
          {
              report[4 + i] = dataIp[i];
          }
        }
        var callback=function(){
          clearWriteCallback=setTimeout(function(){
            WriteUUID(uuidIp,writeLength,dataIp,true,finalCallback);
          },10)
        }
        sendByteData(false,report,callback,connectionId,'WriteUUID')
    }else{
      if(finalCallback){        
        stopWriteUUID=true;
        while (clearWriteCallback--) {
            window.clearTimeout(clearWriteCallback); // will do nothing if no timeout with id is present
        }
        finalCallback();
      }
    }
  }
  
  function GetDongleState(){
    report=new Uint8Array(64);
    report[0]=MI_GET_DONGLE_STATE;
    ////console.log(report);
    // console.log('sending GETDONGLESTATE');
    no_connectReq=0;
    sendByteData(true,report,null,connectionId_FIDO_FIDO,'GETDONGLESTATE')
  }

  function GO225_dfu_mode(){
    Feedback_updater(null,'GETDFUMODE');
    console.log('in GO225_dfu_mode func')
    for(var i=0;i<connection_cid.length;i++){
      report[i]=connection_cid[i];
    }
    var DPGO225_DFU_MODE = new Uint8Array([0x83, 0x00, 0x09, 0x00, 0xC9, 0x1A, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00])
    for(var i=0;i<DPGO225_DFU_MODE.length;i++){
      report[i+connection_cid.length]=DPGO225_DFU_MODE[i];
    }
    console.log('sending data for dfu mode');
    sendByteData(false,report,null,connectionId_FIDO,'DPGO225_DFU_MODE');
  }

  vm.exitClick = function(){
    window.close();
  }

  function initFunctionalityClick(targetId){
    vm.disableDivs=true;
    reInitDivStyle=false;
    clearOutputMsg();
    $scope.$evalAsync(function (){
      vm.constantMsg=false;
      vm['except'+targetId]=true;
      vm.outputColor=targetId+'Color';
      vm[targetId]=false;
      vm[targetId+'hover']=false;
    });
    funcToExec=[];
    stopConnection=false;
    while (deactivateMsgTimer && deactivateMsgTimer>0) {
        window.clearTimeout(deactivateMsgTimer); // will do nothing if no timeout with id is present
        deactivateMsgTimer--;
    }
    deactivateMsgTimer=0;
  }
  //vm.outputColor = {outputDivColor : true, addClick : false, bleClick : false};
  //on click event handling
  vm.clickDiv=function(targetId){
	console.log("click detected: " + targetId);
    if(vm.disableDivs){
		if(targetId == 'ChangeUImode')
		{
			console.log("Return button");
			document.getElementById('feedback').style.heigth = '0px';
			firmIdx=0;														//clear always firmware counter
			//document.getElementById('feedback_picture').src = "";
			
			document.getElementById('updateVersionDongle_label').style.visibility = 'hidden';
			document.getElementById('updateVersionFIDO_label').style.visibility = 'hidden';
		
			document.getElementById('fileUploadCtrlBleDev').style.visibility = 'hidden';
			document.getElementById('fileUploadCtrlDongle').style.visibility = 'hidden';
			
			document.getElementById('updateVersionDongle').style.height = '0';
			document.getElementById('updateVersionFIDO').style.height = '0';
			
			document.getElementById('update').style.height = '0px';
									
			funcToExec=[];															//clear function to exec
			deActivateMsgDirect();
			setTimeout(function(){
					deActivateMsgDirect();							//disable running functions
			},500);
			
		}
		else if(targetId == 'ApplicationInfo')
		{
			console.log("Show application info");
			document.getElementById('feedback').style.heigth = '0px';
			//document.getElementById('feedback_picture').src = "";
			
			document.getElementById('updateVersionDongle_label').style.visibility = 'hidden';
			document.getElementById('updateVersionFIDO_label').style.visibility = 'hidden';
		
			document.getElementById('fileUploadCtrlBleDev').style.visibility = 'hidden';
			document.getElementById('fileUploadCtrlDongle').style.visibility = 'hidden';
			
			document.getElementById('updateVersionDongle').style.height = '0';
			document.getElementById('updateVersionFIDO').style.height = '0';
			
			document.getElementById('update').style.height = '0px';
			
			funcToExec=[];
			Feedback_updater(null,'ApplicationInfo');
		}
		return;										
    }
	if(advanced == false)															//disable unwanted clicks
	{
		if(targetId == 'firmwareUpdate' || targetId == 'eraseBondDongle')
			return;
	}
	
	if (DpbbStateJustChanged == false)
	{
		if(amountDevices > 2 && targetId != 'ApplicationInfo')
		{
			bootbox.alert(chrome.i18n.getMessage("BRIDGE_To_Many_Feedback"), function() {
			});
			return;

		}
		else if(amountDevices == 0 && targetId != 'ApplicationInfo')
		{
			bootbox.alert(chrome.i18n.getMessage("BRIDGE_Insert_Request"), function() {
			});
			return;
		}
	}
	
	if(advanced == true && firmwareUpdateMenu == false)
	{
		if(targetId == 'updateVersionFIDO' || targetId == 'updateVersionDongle')
		{
			console.log("unwanted click");
			return;
		}
	}
	
	if(targetId != 'ChangeUImode')					//get the feedback window
	{
		if(advanced == true)
		{
			document.getElementById('feedback_div').style.height = windowheightAdv;
		}
		else
		{
			document.getElementById('feedback_div').style.height = windowheightBasic;
		}
		document.getElementById('changeUImode').src = "Images/return_btn.png";
		document.getElementById('changeUImode').style.marginTop = "25px";
		document.getElementById('feedback_div').style.visibility = 'visible';
		console.log("Get feedback window");
	}
	
	if(targetId !='updateVersionFIDO' && targetId !='updateVersionDongle'){
		  initFunctionalityClick(targetId);
	}
    clickedTarget=targetId;
    switch(targetId){
		case 'ChangeUImode':
			console.log("Change Ui mode");
			
			if(advanced == true)
			{
					document.getElementById('DPBBupdate').style.height = "0px";
					document.getElementById('eraseBondDongle').style.height = "0px";
					
					document.getElementById('advancedFunctions').style.height = '0';
					document.getElementById('feedback').style.heigth = '0';
					
					document.getElementById('erase_dpbb_pairings_label').style.visibility = 'hidden';
					document.getElementById('firmware_update_label').style.visibility = 'hidden';

					document.getElementById('changeUImode').src="Images/adv_plus.png";
					self.resizeTo(windowWidth,windowheightBasic);
					console.log("Go to basic mode");
					advanced = false;
			}
			else
			{
					document.getElementById('erase_dpbb_pairings_label').style.visibility = 'visible';
					document.getElementById('firmware_update_label').style.visibility = 'visible';
					
					document.getElementById('advancedFunctions').style.height = '';
					document.getElementById('feedback').style.heigth = '';
					
					document.getElementById('DPBBupdate').style.height = "95px";
					document.getElementById('eraseBondDongle').style.height = "100px";
	
					console.log("Go to advanced mode");
					document.getElementById('changeUImode').src="Images/adv_min.png";
					self.resizeTo(windowWidth,windowheightAdv);
					advanced = true;
			}
			
			vm.outputColor='outputDivColor';
			activateBtn(false,true);
			break;
		case 'closeButton':
			console.log("Close button");
			self.close();
			break;
		case 'addNewBond':
			console.log('Add new bond');
			document.getElementById('feedback_picture').src = "Images/DP-GO225-pair-animated-small.gif";
			document.body.onfocus = null;
			addNewBondCallback();
		break;
		 case 'testRSSI':
				console.log('test rssi');
				console.log('clearing on focus');
				document.body.onfocus =null;
				rssiValueCallback();
			break;
      case 'eraseBondDongle':
      bootbox.confirm(chrome.i18n.getMessage("BRIDGE_Remove_Pairing_Request"), function(result) {                
        if (result) {      
          //vm.outputColor.outputDivColor  = false;
          //vm.outputColor.eraseBondClick = true;
		  console.log('clearing on focus');
          document.body.onfocus =null;
          eraseBondCallback();         
        } else {
          activateBtn(false,true);
          //canceled by user                            
        }
      });
      break;
      case 'eraseBondFIDO':
	  document.getElementById('feedback_picture').src = "Images/DP-GO225-on-animated-small.gif";
      bootbox.confirm(chrome.i18n.getMessage("BLE_Remove_Pairing_Request"), function(result) {                
        if (result) {  
          //vm.outputColor.outputDivColor  = false;
          //vm.outputColor.eraseSecureClick = true;
		console.log('clearing on focus');
          document.body.onfocus =null;
          eraseBondFidoCallback();                                           
        } else {
          vm.outputColor='outputDivColor';
          activateBtn(false,true);
          //canceled by user                                             
        }
      });
      // var r = confirm("are you sure?");
      // if (r == true) {
      //     //vm.outputColor.outputDivColor  = false;
      //     //vm.outputColor.eraseSecureClick = true;
      //     document.body.onfocus =null;
      //     eraseBondFidoCallback();
      // } 
      break;
      case 'checkVersionDongle':
        console.log('Request the DPBB version');
		console.log('clearing on focus');
        document.body.onfocus =null;
        versionDongleCallback();
      break;
      case 'checkVersionFIDO':
		console.log('clickdiv - checkVersionFIDO');
		document.getElementById('feedback_picture').src = "Images/DP-GO225-on-animated-small.gif";
        document.body.onfocus =null;
        getSecureClickVersion();
      break;
      case 'updateVersionDongle':
			firmwareUpdateMenu = false;
			console.log('Click on update dongle firmware');	
			document.getElementById('updateVersionDongle_label').style.visibility = 'hidden';
			document.getElementById('updateVersionFIDO_label').style.visibility = 'hidden';
		
			document.getElementById('fileUploadCtrlBleDev').style.visibility = 'hidden';
			document.getElementById('fileUploadCtrlDongle').style.visibility = 'hidden';
			firmIdx = 0;										//restart the counter
			$("#fileUploadCtrl").click();
      break;
      case 'updateVersionFIDO':
		firmwareUpdateMenu = false;
		console.log('Click on update SecureClick firmware');
		document.getElementById('updateVersionDongle_label').style.visibility = 'hidden';
		document.getElementById('updateVersionFIDO_label').style.visibility = 'hidden';
		
		document.getElementById('fileUploadCtrlBleDev').style.visibility = 'hidden';
		document.getElementById('fileUploadCtrlDongle').style.visibility = 'hidden';
		$("#DPGOfileUploadCtrl").click();
      break;
	  case 'ApplicationInfo':
		console.log("Show application info");
		Feedback_updater(null,'ApplicationInfo');
		break;
	  case 'firmwareUpdate':
		console.log("Firmware update");
		document.getElementById('update').style.height = '238px';					//always in advanced mode

		document.getElementById('updateVersionDongle').style.height = '160px';
		document.getElementById('updateVersionFIDO').style.height = '160px';
		
		document.getElementById('updateVersionDongle_label').style.visibility = 'visible';
		document.getElementById('updateVersionFIDO_label').style.visibility = 'visible';

		document.getElementById('fileUploadCtrlBleDev').style.visibility = 'visible';
		document.getElementById('fileUploadCtrlDongle').style.visibility = 'visible';

		firmwareUpdateMenu = true;
		break;
    }
  }

  // function checkIfCancel(ipFile,cmd){
  //   console.log('clearing on focus');
  //   document.body.onfocus =null;
  //   console.log('in checkIfCancel=');
  //   console.log(!(ipFile && ipFile[0].files && ipFile[0].files.length && ipFile[0].files.length>0));
  //   setTimeout(function(){
  //     if(!(ipFile && ipFile[0].files && ipFile[0].files.length && ipFile[0].files.length>0)){
  //       console.log('no file found cancel');
  //       if(cmd=='fileUploadCtrl')
  //         Feedback_updater(null,'NoFileSelectedBLE');
  //       if(cmd=='DPGOfileUploadCtrl')
  //         Feedback_updater(null,'NoFileSelectedSC');
  //       vm.constantMsg=true;
  //       console.log('in cancel');
  //       deActivateMsg(null,true);
  //     }
  //   },0)
  // }

  vm.hoverDiv=function(targetId){
	  
	switch(targetId){
		case 'DongleInfo':
			var DongleInfoID = document.getElementById('DongleInfo');			//change picture of the dongle info when hover
			DongleInfoID.src = "Images/dp_bb_info.png"
			break;
		case 'BLEDeviceInfo':												//change picture of the BLE device info when hover
			var BLEDeviceInfoID = document.getElementById('BLEDeviceInfo');
			BLEDeviceInfoID.src = "Images/ble_dev_info.png"
			break;
		case 'add_New_Bond':
			var Add_ble_dev_labelID = document.getElementById('Add_ble_dev_label');
			Add_ble_dev_labelID.style.color = "#651164";
			Add_ble_dev_labelID.style.fontStyle = "italic";
			break;
		case 'Erase_ble_dev_pairings':
			var Erase_ble_dev_pairingsID = document.getElementById('Erase_ble_dev_pairings_label');
			Erase_ble_dev_pairingsID.style.color = "#651164";
			Erase_ble_dev_pairingsID.style.fontStyle = "italic";
			break;
		case 'firmware_update':
			var firmware_updateID = document.getElementById('firmware_update_label');
			firmware_updateID.style.color = "#651164";
			firmware_updateID.style.fontStyle = "italic";
		break;
		case 'erase_dpbb_pairings':
			var erase_dpbb_pairings_labelID = document.getElementById('erase_dpbb_pairings_label');
			erase_dpbb_pairings_labelID.style.color = "#651164";
			erase_dpbb_pairings_labelID.style.fontStyle = "italic";
		break;	
		case 'updateVersionFIDO':
			document.getElementById('updateVersionFIDO_label').style.color = "#651164";
			document.getElementById('updateVersionFIDO_label').style.fontStyle = 'italic';
		break;
		case 'updateVersionDongle':
			document.getElementById('updateVersionDongle_label').style.color = "#651164";
			document.getElementById('updateVersionDongle_label').style.fontStyle = 'italic';
		break;
	}
	
    if(vm.disableDivs && targetId!=clickedTarget && targetId!=null){
      return;
    }else if(vm.disableDivs && targetId==clickedTarget){
      $scope.$evalAsync(function (){
        vm[targetId]=true;
        vm[targetId+'hover']=true;
      });
    }else{
      clearOutputMsg();	
      //Feedback_updater(targetId,'defaultText');
      $scope.$evalAsync(function (){
        vm[targetId]=true;
        vm[targetId+'hover']=true;
      });
    }
  }
  vm.mouseleave=function(targetId){
	switch(targetId){
		case 'DongleInfo':													//change picture of the dongle info when mouse leaves picture
			var DongleInfoID = document.getElementById('DongleInfo');
			DongleInfoID.src = "Images/dp_bb_persp.png"
			break;
		case 'BLEDeviceInfo':											//change picture of the BLE device info when mouse leaves picture
			var BLEDeviceInfoID = document.getElementById('BLEDeviceInfo');
			BLEDeviceInfoID.src = "Images/ble_dev_persp.png"
			break;
		case 'add_New_Bond':
			var Add_ble_dev_labelID = document.getElementById('Add_ble_dev_label');
			Add_ble_dev_labelID.style.color = "#08426b";
			Add_ble_dev_labelID.style.fontStyle = "normal";
		break;
		case 'Erase_ble_dev_pairings':
			var Erase_ble_dev_pairingsID = document.getElementById('Erase_ble_dev_pairings_label');
			Erase_ble_dev_pairingsID.style.color = "#08426b";
			Erase_ble_dev_pairingsID.style.fontStyle = "normal";
		break;
		case 'firmware_update':
			var firmware_updateID = document.getElementById('firmware_update_label');
			firmware_updateID.style.color = "#08426b";
			firmware_updateID.style.fontStyle = "normal";
		break;
		case 'erase_dpbb_pairings':
			var erase_dpbb_pairings_labelID = document.getElementById('erase_dpbb_pairings_label');
			erase_dpbb_pairings_labelID.style.color = "#08426b";
			erase_dpbb_pairings_labelID.style.fontStyle = "normal";
		break;	
		case 'updateVersionFIDO':
			document.getElementById('updateVersionFIDO_label').style.color = "#08426b";
			document.getElementById('updateVersionFIDO_label').style.fontStyle = 'normal';
		break;	
		case 'updateVersionDongle':
			document.getElementById('updateVersionDongle_label').style.color = "#08426b";
			document.getElementById('updateVersionDongle_label').style.fontStyle = 'normal';
		break;
	}  
  }
  
  vm.hoverOutDiv=function(targetId){
    if(vm.disableDivs && targetId!=clickedTarget && targetId!=null){
      return;
    }else if(vm.disableDivs && targetId==clickedTarget){
      $scope.$evalAsync(function (){
        vm[targetId]=false;
        vm[targetId+'hover']=false;
      });
    }else{
      $scope.$evalAsync(function (){
        vm.showOutputMessage=false;
        vm[targetId]=false;
        vm[targetId+'hover']=false;
      });
    }
  }

  vm.myClass = {exitColor : true, exitHover: false};
  //hover in event callback
  vm.hoverInExit = function(){
    $scope.$evalAsync(function (){
      vm.myClass.exitColor = false;
      vm.myClass.exitHover = true;
    });
  }
  //hover out event callback
  vm.hoverOutExit = function(){
    $scope.$evalAsync(function (){
      vm.myClass.exitHover = false;
      vm.myClass.exitColor = true;
    });
  }
});