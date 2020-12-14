const connectWallet = document.querySelector('.unlock-wallet');
const withdrawRewardsButton = document.querySelector('.withdraw-rewards');
const enolBalance = document.querySelector('.enol-balance');
const totalLiquidityLocked = document.querySelector('.total-liquidity-locked');
const eligibleRewards = document.querySelector('.eligible-rewards');
const user_rewards = document.querySelector('.user-rewards');
const walletId = document.querySelector('.wallet-id');
const currentUSDBalance = document.querySelector('.current-balance-usd');
const renderTransactionView = document.querySelector('.trans_h_g');

const transactionCount = document.querySelector('.transaction-count');

import { abi as ethanolTokenABI } from './abi/Ethanol.js';
import { abi as ethanolVestABI } from "./abi/EthanolVault.js";

const apiKey = '7QEMXYNDAD5WT7RTA5TQUCJ5NIA99CSYVI ';
const EthanolAddress = '0x63D0eEa1D7C0d1e89d7e665708d7e8997C0a9eD6';
const EthnolVestAddress = '0xf34F69fB72B7B6CCDbdA906Ad58AF1EBfAa76c42';

// const lpUserAddress = '0x3a2fb39f16afa7f745375d4181e80ee9f962ea90';

let web3;
let EthanolToken;
let EthanoVault;
let user;

const toWei = _amount => web3.utils.toWei(_amount.toString(), 'ether');
const fromWei = _amount => web3.utils.fromWei(_amount.toString(), 'ether');

// window.addEventListener('DOMContentLoaded', async () => {
//   await connectDAPP();
// })

const loadWeb3 = async () => {
    if(window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        // cancel autorefresh on network change
        window.ethereum.autoRefreshOnNetworkChange = false;

    } else if(window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
    } else {
        alert("Non-Ethereum browser detected. You should consider trying Metamask")
    }
}


const loadBlockchainData = async () => {
    let networkType;
    try {
        web3 = window.web3;

        networkType = await web3.eth.net.getNetworkType();

        if(networkType !== "main") {
            alert("Connect wallet to a main network");
            throw new Error();
        }

        EthanolToken = new web3.eth.Contract(ethanolTokenABI, EthanolAddress);
        EthanoVault = new web3.eth.Contract(ethanolVestABI, EthnolVestAddress);
        const accounts = await web3.eth.getAccounts();
        user = accounts[0];
        await settings();

        
    } catch (error) {
        console.error({
            error
        })
    }
}


const connectDAPP = async () => {
    await loadWeb3();
    await loadBlockchainData(); 
}


const settings = async () => {
    if(user) connectWallet.classList.add('hide');

    // Selected wallet id
    walletId.textContent = 1;
    
    // Current user ENOL balance
    const _enolBalance = await balanceOf(user);
    enolBalance.textContent = `${Number(fromWei(_enolBalance)).toFixed(2)} ENOL`;

    // Total iquidity locked
    totalLiquidityLocked.textContent = `$251,000`;

    // Eligible rewards
    const _eligibleRewards = await calculateRewards();
    eligibleRewards.textContent = `${_eligibleRewards} %`;

    // User rewards
    const _rewards = await checkRewards();
    user_rewards.textContent = `${Number(fromWei(_rewards)).toFixed(2)} Enol`;

    // calculate current USD balance
    let _currentUSDBalance = await getCurrentPrice('ethanol');
    _currentUSDBalance = Number(_currentUSDBalance.ethanol.usd) * Number(fromWei(_enolBalance));
    currentUSDBalance.textContent = `${Number(_currentUSDBalance).toFixed(2)} USD`;

    // Fetch user transactions count
    await txnLists();
    await renderLatestTransactions();

    // console.log(
    //     shortener()
    // )
}

const balanceOf = async _account => {
    const _user = _account ? _account : user;
    return await EthanolToken.methods.balanceOf(_user).call();
}

const withdrawRewards = async () => {
    try {
        const _rewards = await EthanoVault.methods.checkRewards(user).call();
        const reciept = await EthanoVault.methods.withdrawRewards(_rewards).send(
            { from: user, gas: '25000' }
        );
        alert('Withdraw successful');
        console.log(reciept)
        return reciept;
    } catch (error) {
        alert(error.message);
    }
}

const calculateRewards = async () => {
    try {
        const _balance = (await balanceOf(user)).toString();
        let result  = '0';
        if(Number(fromWei(_balance)) > '2' && Number(fromWei(_balance)) < '5') {
            result = '10';
        } else if(Number(fromWei(_balance)) >= '5' && Number(fromWei(_balance)) < '10') {
            result = '20'
        } else if(Number(fromWei(_balance)) >= '10' && Number(fromWei(_balance)) < '20') {
            result = '30'
        } else if(Number(fromWei(_balance)) >= '20' && Number(fromWei(_balance)) < '30') {
            result = '40'
        } else if(Number(fromWei(_balance)) >= '30' && Number(fromWei(_balance)) < '40') {
            result = '50'
        } else if(Number(fromWei(_balance)) >= '40' && Number(fromWei(_balance)) < '99') {
            result = '60'
        } else if(Number(fromWei(_balance)) >= '100') {
            result = '100'
        }
        return result.toString();
    } catch (error) { console.log(error.message) }
}

const checkRewards = async () => {
    try {
        let result = await EthanoVault.methods.checkRewards(user).call();
        return result.toString();
    } catch (error) {
        console.error(error.message)
    }
}

const txnLists = async () => {
    try {
        const result = await (await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${user}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`)).json();
        const response = await result.result;
        transactionCount.textContent = `${response.length}`;
        return result.result;
    } catch (error) { console.error(error.message) }
}

const getLastTenTransactions = async () => {
    try {
        const _data = await txnLists();
        let startCount = _data.length - 10;
        let tempArray = [];
        for(let i = startCount; i < _data.length; i++) {
            tempArray = [...tempArray, _data[i]];
        }
        return tempArray;
    } catch (error) { console.log(error) }
}

const renderLatestTransactions = async () => {
    try {
        const result = await getLastTenTransactions();
        let data = [];

        // const etherPrice = await getCurrentPrice('ethereum');
        // console.log(etherPrice.ethereum.usd);

        const header = (
            `<div class="trans_h_m">
                <span class="trans_h1">Transaction hash</span>
                <span class="trans_h2">From</span>
                <span class="trans_h3">To</span>
                <span class="trans_h4">Gas used (Average)</span>
                <span class="trans_h5">&nbsp;</span>
            </div>`
        );

        let tempItems = result.map(item => {
            const gasUsed = Number(web3.utils.fromWei(item.gasPrice, 'gwei')).toFixed(2);
            return (
                `<div class="trans_d_m">
                    <span class="trans_d1"><a href="https://etherscan.io/tx/${item.hash}" target="_blank">0x*****${shortener(item.hash, true)}</a></span>
                    <span class="trans_d2"><a href="https://etherscan.io/address/${item.from}" target="_blank">0x*****${shortener(item.from)}</a></span>
                    <span class="trans_d3"><a href="https://etherscan.io/address/${item.to}" target="_blank">0x*****${shortener(item.to)}</a></span>
                    <span class=${item.from === user ? "trans_d4 red" : "trans_d4"}>${gasUsed} GWei</span>
                </div> `
            )
        })
        data = [header];
        if(tempItems[0] !== undefined) {
            data = [...data, tempItems];
        }
        data = data.join('');
        renderTransactionView.innerHTML = data;
        return data;
    } catch (error) {
        renderTransactionView.innerHTML = "No transaction history found...";
        console.log("No transaction history found...")
    }
}

const getCurrentPrice= async (token) => {
    try {
        let result = await (await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=USD`)).json();
        return result;
    } catch (error) {
        console.log(error)
    }
}

const shortener = (_data, isHash) => {
    const tempItems = _data.split('');
    let result = [];

    if(isHash) {
        for(let i = 55;  i < tempItems.length; i++) result = [...result, tempItems[i]];
        return result.join('');
    }
    for(let i = 35;  i < tempItems.length; i++) result = [...result, tempItems[i]];
    return result.join('');
}

connectWallet.addEventListener('click', async e => {
    e.preventDefault();
    await connectDAPP();
})

withdrawRewardsButton.addEventListener('click', async e => {
    e.preventDefault();
    await withdrawRewards()
})