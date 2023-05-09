const Web3Modal = window.Web3Modal.default;
const walletConnectProvider = window.WalletConnectProvider.default;

const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;

// Contracts

var pubChainId = 0;

var strConnectWallet = "<i class=\"fas fa-wallet pr-1\"></i>Connect Wallet";
var strDisconnectWallet = "<i class=\"fas fa-sign-out-alt\"></i>Disconnect Wallet";

const maxUint256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

var web3BaseUrl_main;
var web3_main;
var OCP_instance;

var isMobile = false;

let chainId = 0;
let accounts;
let chainData;

var minimumAmount = 250000;
var maxiumAmount = 2500000;

var dataInterval;
var _presaledAmount = 250000;
var _presaledAmountbyCustomers = 0;
var launchDate = 1677715200
var launchDate1 = 1680307199;

window.addEventListener('load', async () => {

  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    // true for mobile device
    isMobile = true;
  } else {
    isMobile = false;
    // false for not mobile device
  }

  init();

  var innerWidth = window.innerWidth;
  var innerHeight = window.innerHeight;
  if (innerWidth > 1000)
    $(".dropdown-toggle::after").addClass("nav-separete");

});

async function onConnect() {
  try {
    provider = null;
    provider = await web3Modal.connect();
    fetchAccountData();

  } catch (e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  // Subscribe to networkId change
  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });

}

async function onDisconnect() {
  selectedAccount = null;
  pubChainId = 0;

  jQuery(".connect-wallet").html(strConnectWallet);
  jQuery(".connect-wallet").removeAttr('data-toggle');
  jQuery(".connect-wallet").removeAttr('onclick');
  jQuery(".connect-wallet").removeAttr('data-target');
  jQuery(".connect-wallet").attr('onclick', "connectWallet()");

  if (provider) {
    try {
      await provider.close();
    } catch (e) {
      console.log("disconnect", e)
    }
    provider = null;
    await web3Modal.clearCachedProvider();
  }

  clearInterval(dataInterval);
}

function connectWallet() {
  if (provider) {
    onDisconnect();
  } else {
    onConnect();
  }
}

async function fetchAccountData() {
  if (!isMobile) {
    web3 = new Web3(window.ethereum);
    if (window.ethereum) {
      try {
        // Request account access if needed
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        chainId = await ethereum.request({ method: 'eth_chainId' });

      } catch (error) {
        console.log(error);
      }
    }

    changeNetwork();

    provider = window.ethereum;
  } else {
    web3 = new Web3(provider);
    chainId = await web3.eth.getChainId();
    // chainData = evmChains.getChain(chainId);
    accounts = await web3.eth.getAccounts();
  }

  jQuery(".connectWallet").removeClass("connectWallet");
  jQuery("#btn-approve").removeAttr("disabled");
  jQuery("#btn-confirm").removeAttr("disabled");

  if (chainId != 56 && chainId != 97) {
    onDisconnect();
    Swal.fire({
      icon: 'error',
      title: 'Wrong network',
      text: 'Change network BSC network'
    })
    return false;
  } else if (chainId == 56 && testMode) {
    onDisconnect();
    Swal.fire({
      icon: 'error',
      title: 'Wrong network',
      text: 'Change network to BSC Test Network'
    })
    return false;
  } else if (chainId == 97 && !testMode) {
    onDisconnect();
    Swal.fire({
      icon: 'error',
      title: 'Wrong network',
      text: 'Change network to BSC Main Network'
    })
    return false;
  }

  selectedAccount = accounts[0];

  pubChainId = chainId;

  jQuery(".connect-wallet").html('<div class="spinner-border text-dark" role="" ></div>');
  jQuery("#pubAccountAddress").html(selectedAccount);

  jQuery(".connect-wallet").html("<i class=\"fas fa-wallet pr-1\"></i>" + selectedAccount.substr(0, 7) + "..." + selectedAccount.substr(selectedAccount.length - 4, selectedAccount.length));

  jQuery(".connect-wallet").attr("onclick", "openDisconnectModal()");
  jQuery(".connect-wallet").attr("data-toggle", "modal");
  jQuery(".connect-wallet").attr("data-target", "#disconnectModal");

  var prebuyInfo = await OCP_instance.methods._prebuyInfo(selectedAccount).call();
  // console.log(prebuyInfo);

  jQuery("#ocp_balance").html(web3_main.utils.fromWei(prebuyInfo.prebuyamount, 'ether'));
  if (parseInt(web3_main.utils.fromWei(prebuyInfo.prebuyamount, 'ether')) >= 2500000) {
    jQuery("#btn-approve").attr("disabled", true);
  } else {
    jQuery("#btn-approve").removeAttr("disabled");
  }

  getNativeBalance();
}

function openDisconnectModal() {
  jQuery(".copyAddressTip").hide();
}

async function changeNetwork() {
  var chainId = testMode ? 97 : 56;
  var result = await ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: "0x" + parseInt(chainId).toString(16) }],
  });
}

function selectMax() {
  $(".input-amount").val(2500000);
  validInput()
}

function validInput() {
  // if (provider == null) {
  // Swal.fire({
  //   icon: 'error',
  //   title: 'Transaction Fail',
  //   text: 'Transaction has been rejected'
  // })
  // return false;
  // }
  $(".input-amount").removeClass("invalidInput");
  getNativeBalance()
  _presaledAmount = parseInt($(".input-amount").val());

  if ($(".input-amount").val() != "" && (parseInt($(".input-amount").val()) > 1125000000 || $(".input-amount").val() <= 0)) {
    $(".error-msg").html("Invalid amount");
    $(".error-msg").show();
    $("#est_interest").html("0.000");
    return false;
  }

  if (parseInt($(".input-amount").val()) < minimumAmount) {
    $(".error-msg").html("Please enter higher amount than minimum amount");
    $(".error-msg").show();
    $("#est_interest").html("0.000");
    return false;
  }

  if (parseInt($(".input-amount").val()) > maxiumAmount) {
    $(".error-msg").html("Please enter smaller amount than maxium amount");
    $(".error-msg").show();
    $("#est_interest").html("0.000");
    return false;
  }

  if ($(".input-amount").val() == "") {
    $(".error-msg").hide();
    $("#est_interest").html("0.000");
    return false;
  }

  $(".error-msg").hide();
  return true;
}

function checkMax() {
  if (parseFloat(selectedCoinBalance) > 0) {
    jQuery("#selectMax").removeAttr("disabled");
    jQuery("#input-amount").removeAttr("disabled");
  } else {
    jQuery("#selectMax").attr("disabled", "true");
    jQuery("#input-amount").attr("disabled", "true");
  }
}

async function init() {
  if (window.ethereum) {

    provider = window.ethereum;

    jQuery("#btn-connect-wallet").html("<i class='fas fa-spinner'></i>");

    // Subscribe to accounts change
    provider.on("accountsChanged", (accounts) => {
      fetchAccountData();
    });

    // Subscribe to chainId change
    provider.on("chainChanged", (chainId) => {
      fetchAccountData();
    });

    // Subscribe to networkId change
    provider.on("networkChanged", (networkId) => {
      fetchAccountData();
    });

    fetchAccountData();
  }

  const providerOptions = {
    walletconnect: {
      package: walletConnectProvider,
      options: {
        rpc: {
          56: 'https://bsc-dataseed1.binance.org/',
          97: 'https://data-seed-prebsc-1-s3.binance.org:8545/',
        },
        network: "BSC", // --> this will be use to determine chain id 56
      },
    },
  };

  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    // disableInjectedProvider: isMobile, // optional. For MetaMask / Brave / Opera.

  });

  web3BaseUrl_main = testMode ? 'https://data-seed-prebsc-1-s3.binance.org:8545/' : 'https://bsc-dataseed1.binance.org/';
  web3_main = new Web3(new Web3.providers.HttpProvider(web3BaseUrl_main));

  OCP_instance = new web3_main.eth.Contract(ocpabi, OCP_Contract);
  getOCPPresaleAmountInfo();

  var showPresaledInfo = setInterval(function () {
    getOCPPresaleAmountInfo();
  }, 60000);

  // calcDate();

  var updatePresaleSeason = setInterval(function () {
    updateCountdown();
  }, 1000)

  var updateWalletBalance = setInterval(function () {
    getNativeBalance();
  }, 60000)
}

async function updateCountdown() {
  if (launchDate > 0) {
    var _now = new Date();
    _now = parseInt(_now.getTime() / 1000);
    let deadline = launchDate - _now;
    if (deadline < 0) {
      deadline = launchDate1 - _now;
    }
    if (deadline > 0) {
      let _day = parseInt(deadline / (24 * 3600))
      let _hour = parseInt(deadline % (24 * 3600) / 3600)
      let _mins = parseInt((deadline % 3600) / 60)
      let _sec = parseInt(deadline % 60)

      if (_day > 0) {
        $("#presaledeadline").html(`${_day} Days: ${_hour} : ${_mins} : ${_sec}`)
      } else {
        $("#presaledeadline").html(`${_hour} : ${_mins} : ${_sec}`)
      }
    } else {
      $("#presaledeadline").html("Finished")
    }
  } else {
    $("#presaledeadline").html("-- Days : -- : -- : --")
  }
}

async function getOCPPresaleAmountInfo() {
  try {
    var presaledAmount = await OCP_instance.methods._presaledAmount().call();
    _presaledAmountbyCustomers = 1125000000 - parseInt(presaledAmount / 10 ** 18);
    $("#totalLockedBalance").html(_presaledAmountbyCustomers);
    $("#input_presale_sold").html(1125000000 - _presaledAmountbyCustomers);
    $("#input_presale_remaining").html(_presaledAmountbyCustomers);
    $("#est_apr").html((presaledAmount / 10 ** 18 / 1125000000).toFixed(5))
    $("#est_apr1").html((presaledAmount / 10 ** 18 / 1125000000).toFixed(5) + " %")
  }
  catch (err) {
    console.log(err)
  }
}

// async function calcDate() {
//   var _startDate = await OCP_instance.methods._startTime().call();
//   launchDate = _startDate;
//   _startDate = parseInt(_startDate);
//   var date = new Date(_startDate * 1000);
//   var date1 = new Date((_startDate + 24 * 3600 * 30) * 1000);
//   var date2 = new Date((_startDate + 24 * 3600 * 50) * 1000);
//   var date3 = new Date((_startDate + 24 * 3600 * 150) * 1000);

//   $("#start-date").html(date.toDateString());
//   $("#value-date").html(date1.toDateString());
//   $("#interest-end-date").html(date2.toDateString());
//   $("#redemption-date").html(date3.toDateString());
// }

jQuery(document).ready(function () {
  jQuery(".connectWallet").on("click", function () {
    if (provider) {
      onDisconnect();
    } else {
      onConnect();
    }
  });
});

function onlyNumberKey(evt) {
  // Only ASCII character in that range allowed
  var ASCIICode = (evt.which) ? evt.which : evt.keyCode
  if (ASCIICode > 31 && (ASCIICode < 46 || ASCIICode > 57))
    return false;
  return true;
}

async function getNativeBalance() {
  try {
    if (provider != null) {
      let _balance = web3_main.utils.fromWei(await web3_main.eth.getBalance(selectedAccount));
      var bnb = await OCP_instance.methods.presaleAmountPerbnb(_presaledAmount).call();
      bnb = parseFloat(web3_main.utils.fromWei(bnb, 'ether'))
      $(".input-amount1").val(parseFloat(bnb + 0.01).toFixed(4))
    } else {
      var _totalmoney = 0.0001 * _presaledAmount;
      var bnb = parseFloat(_totalmoney / 270);
      $(".input-amount1").val(parseFloat(bnb).toFixed(4))
    }
  } catch (error) {
    console.log(error)
  }
}

async function buyPresale() {
  // jQuery("#btn-approve").addClass("disabled");
  if (provider == null) {
    Swal.fire({
      icon: 'error',
      title: 'Connect Wallet',
      text: 'Please connect wallet to buy OCP token'
    })
    return;
  }
  jQuery("#btn-approve").html("Processing...");
  try {
    var approve;
    var bnb = await OCP_instance.methods.presaleAmountPerbnb(_presaledAmount).call();
    bnb = parseInt(bnb)
    bnb += 1e16;
    // bnb = parseFloat(web3_main.utils.fromWei(bnb, 'ether'))
    // console.log('bnb', bnb) 
    var data = OCP_instance.methods.buyTokenasPresale(_presaledAmount).encodeABI();
    var gasPrice = await web3_main.eth.getGasPrice();
    const tx = {
      from: selectedAccount,
      to: OCP_Contract,
      gasPrice: gasPrice,
      data: data,
      value: bnb
    };

    console.log(tx);
    approve = await web3.eth.sendTransaction(tx);
    if (approve.status) {
      // jQuery("#btn-approve").hide();
      // jQuery("#btn-confirm").show();
      fetchAccountData();
      jQuery("#btn-approve").html("BUY OCP");
      return;
    }
    jQuery("#btn-approve").html("BUY OCP");
  } catch (Exception) {
    console.log('error', Exception)
    // jQuery("#btn-approve").removeClass("disabled");
    jQuery("#btn-approve").html("BUY OCP");
  }
}

function searchAccount() {
  if (parseInt(pubChainId) == "56")
    window.open("https://bscscan.com/address/" + selectedAccount, "_newtab");
  if (parseInt(pubChainId) == "97")
    window.open("https://testnet.bscscan.com/address/" + selectedAccount, "_newtab");
}

function copyToClipboard(text) {
  var dummy = document.createElement("textarea");

  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
  jQuery(".copyAddressTip").css("display", "block");

  clearInterval(showCopied);

  var showCopied = setInterval(function () {
    jQuery(".copyAddressTip").hide();
  }, 3000);

  var hideCopied = setInterval(function () {
    jQuery(".copyAddressTip").hide();
  }, 6000);

  var showCopied = setInterval(function () {
    clearInterval(showCopied);
    clearInterval(hideCopied);
  }, 20000);
}

// Select Duration
function setAmount(type) {
  if (type == 0) {
    $(".check-active").addClass("hide");
    $(".btn-active").removeClass("btn-active");
    $(".duration0 .check-active").removeClass("hide");
    $(".duration0").addClass("btn-active");
    _presaledAmount = 250000
  }

  if (type == 1) {
    $(".check-active").addClass("hide");
    $(".btn-active").removeClass("btn-active");
    $(".duration1 .check-active").removeClass("hide");
    $(".duration1").addClass("btn-active");
    _presaledAmount = 500000
  }

  if (type == 2) {
    $(".check-active").addClass("hide");
    $(".btn-active").removeClass("btn-active");
    $(".duration2 .check-active").removeClass("hide");
    $(".duration2").addClass("btn-active");
    _presaledAmount = 750000
  }

  if (type == 3) {
    $(".check-active").addClass("hide");
    $(".btn-active").removeClass("btn-active");
    $(".duration3 .check-active").removeClass("hide");
    $(".duration3").addClass("btn-active");
    _presaledAmount = 1000000
  }

  if (type == 4) {
    $(".check-active").addClass("hide");
    $(".btn-active").removeClass("btn-active");
    $(".duration4 .check-active").removeClass("hide");
    $(".duration4").addClass("btn-active");
    _presaledAmount = 1500000
  }

  if (type == 5) {
    $(".check-active").addClass("hide");
    $(".btn-active").removeClass("btn-active");
    $(".duration5 .check-active").removeClass("hide");
    $(".duration5").addClass("btn-active");
    _presaledAmount = 2000000
  }

  if (type == 6) {
    $(".check-active").addClass("hide");
    $(".btn-active").removeClass("btn-active");
    $(".duration6 .check-active").removeClass("hide");
    $(".duration6").addClass("btn-active");
    _presaledAmount = 2500000
  }
  $(".input-amount").val(_presaledAmount);

  validInput();
}
