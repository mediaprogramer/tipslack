//TipSLACK

// confidencial parameter ---------------------------------

const SYSTEM_PRIVATE_KEY = "aaaa bbbb cccc dddd eeee ffff gggg hhhh iiii jjjj kkkk llll mmmm nnnn oooo pppp";  //sample
const SLACK_HOOK_URL = "https://hooks.slack.com/services/XXXXXXXXX/YYYYYYYYY/ZZZZZZZZZZZZZZZZZZZZZZZZ";
const SLACK_TOKEN = "XXXXXXXXXXXXXXXXXXXXXXX";

// confidencial parameter ---------------------------------

//XEMBook nem-node Framework ///////////////////////////////

const log4js = require('log4js');
log4js.configure(
	{
		appenders: {
			file: { type: "file", filename: "logs/system.log" ,maxLogSize:1048576,buckups:5},
			console: { type: "console" }
		},
		categories: {
			default: { appenders: ["console", "file"], level: "trace" }
		}
	}
);
const logger = log4js.getLogger('default');
logger.info('start logging...');

const nemlibrary = require('nem-library');
const NetworkTypes  = nemlibrary.NetworkTypes;
const BrainPassword = nemlibrary.BrainPassword;
const BrainWallet   = nemlibrary.BrainWallet;
const TransferTransaction = nemlibrary.TransferTransaction;
const TimeWindow = nemlibrary.TimeWindow;
const TransactionHttp = nemlibrary.TransactionHttp;
const MosaicHttp = nemlibrary.MosaicHttp;
const Address = nemlibrary.Address;
const XEM = nemlibrary.XEM;
const PlainMessage = nemlibrary.PlainMessage;
const EmptyMessage = nemlibrary.EmptyMessage;
const Account = nemlibrary.Account;
const MosaicId = nemlibrary.MosaicId;

nemlibrary.NEMLibrary.bootstrap(NetworkTypes.MAIN_NET);
logger.info('connect mainnet...');

const Rx = require("rxjs");
require( "rxjs/add/observable/from");
require( "rxjs/add/operator/mergeMap");
require( "rxjs/add/operator/toArray");
require( "rxjs/add/operator/map");
logger.info('setting rxjs...');

//const url        = require('url');
const express    = require('express');
const bodyParser = require('body-parser');
const request  = require("request");
var app = express();
app.use(log4js.connectLogger(logger));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
/*
app.use(function(req, res, next){
	res.header("Access-Control-Allow-Origin","*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
})
*/
app.listen(1337);
logger.info('start server...');

//XEMBook nem-node Framework ///////////////////////////////

//API
app.post('/tipslack', (req, res) => {

	logger.info('app.post.tipslack:');
	logger.info(req.body);

	if(req.body.token != SLACK_TOKEN){
		logger.info('invalid token:' + req.body.token);
		return false;
	}

	let text = req.body.text.match(/([\w]+)(@)*([\w\.-]+)*( +)*([0-9]+)*( +)*(\w+)*( +)*(.+)*/)
	let command = req.body.text.match(/^([a-zA-Z][\w-]*)(\s.*)?$/);

	if(!command || command[1] == "help"){
		reply(res,
			"TipSLACKの使い方\n"
			+ "/tipslack deposit \n"
			+ "    TipSLACKアドレス確認\n"
			+ "/tipslack withdraw [アドレス] [出金額] [モザイク名] \n"
			+ "    指定アドレスに指定量を出金 \n"
			+ "/tipslack tip [@相手] [チップ量] [モザイク名] [メッセージ] \n"
			+ "    @相手にモザイクを指定数量チップする。"
		);
		return false;
	}

	if (command[1] == "deposit"){
		deposit(res,req.body.user_name);

	}else if(command[1] == "withdraw"){
		let option = command[2].match(/\s+(\S*)\s+(\S*)\s+(\S*)(\s*)(.*)?/);
		let address = option[1];
		let amount = option[2];
		let mosaic = option[3];
		if( text[5] != undefined){
			message = text[5];
		}else{
			message = "";
		}
		withdraw(res,req.body.user_name,address,amount,mosaic,message);

	}else if(command[1] == "tip"){
		let option = command[2].match(/\s+@(\S*)\s+(\S*)\s+(\S*)(\s*)(.*)?/);
		let recieve_user = option[1];
		let amount = option[2];
		let mosaic = option[3];
		if( option[5] != undefined){
			message = option[5];
		}else{

			message = "";
		}
		tip(res,req.body.user_name,recieve_user,amount,mosaic,message);

	}else {
		reply(res,"そのコマンドはまだ実装されていません。詳しくは/tipslack helpをご参考ください。")
	}
});

//実行結果アナウンス
function announce(message){

	var payload= {"text":message }	;
	payload = JSON.stringify(payload);

	request.post({
		url: SLACK_HOOK_URL,
		headers: {"content-type": "application/json"},
		body: payload
	}, function (error, response, body){
		logger.info('announce.request.post.body:' + body);
	});
}

//コマンド受付メッセージ
function reply(res,message){

	let data = {
	 	response_type: 'in_channel',
	 	text: message,
	};
	res.header('Content-Type', 'application/json; charset=utf-8')
	res.send(data);
}

//入金アドレス照会
function deposit(res,user_name){

	reply(res, "<@" +user_name + "> さんのTipSLACKアドレス照会中です。");
	const brainPassword =  new BrainPassword(SYSTEM_PRIVATE_KEY + user_name)
	const brainWallet = BrainWallet.create("TipSLACK", brainPassword);
	announce( "<@" +user_name + "> さんのTipSLACKアドレス:" + brainWallet.address.pretty());
}

//出金
function withdraw(res,user_name,address,amount,mosaic,message){

	reply(res, "<@" +user_name + "> さんの送金リクエストを受付けました。");
	transferTipTransaction(user_name,address,amount,mosaic,message,"成功時メッセージ");
}

//Tip
function tip(res,user_name,recieve_user,amount,mosaic,message){

	//送金先アドレスの照会
	const brainPassword =  new BrainPassword(SYSTEM_PRIVATE_KEY + recieve_user);
	const brainWallet = BrainWallet.create("TipSLACK", brainPassword);
	const address = brainWallet.address.pretty();

	let item = mosaic.split(":");
	if(item.length > 1){

		transferTipMosaicTransaction(user_name,address,amount,item[0],item[1],message,"成功時メッセージ");
		reply(res, "<@" +user_name + "> さんの送金リクエストを受付けました。");

	}else if(mosaic == "XEM" || mosaic == "xem"){

		transferTipTransaction(user_name,address,amount,mosaic,message,"成功時メッセージ");
		reply(res, "<@" +user_name + "> さんの送金リクエストを受付けました。");

	}else{
		reply(res, "モザイクの指定が正しくありません");
	}
}

//モザイク送金
function transferTipMosaicTransaction(user_name,address,amount,namespace,mosaic,message,success_message){

	const transactionHttp = new TransactionHttp();
	const mosaicHttp = new MosaicHttp();

	//送信元アカウント生成
	const brainPassword =  new BrainPassword(SYSTEM_PRIVATE_KEY + user_name)
	const brainWallet = BrainWallet.create("TipSLACK", brainPassword);
	const account = Account.createWithPrivateKey(brainWallet.unlockPrivateKey(brainPassword));

	Rx.Observable.from([
	    {mosaic: new MosaicId(namespace, mosaic), quantity: amount}

	]).flatMap(_ => mosaicHttp.getMosaicTransferableWithAmount(_.mosaic, _.quantity))
    .toArray()
    .map(mosaics => TransferTransaction.createWithMosaics(
        TimeWindow.createWithDeadline(),
        new Address(address),
        mosaics,
        EmptyMessage
        )
    )
    .map(transaction => account.signTransaction(transaction))
    .flatMap(signedTransaction => transactionHttp.announceTransaction(signedTransaction))
    .subscribe(
		value => {
			announce( "<@" +user_name + "> さんのリクエスト結果：\n" + value.message);
			logger.info('transferTipMosaicTransaction.transactionHttp.announceTransaction.subscribe.announce:');
			logger.info(value);

		},
		err => {
			announce( "<@" +user_name + "> さんのリクエスト結果：\n" + err.toString());
			logger.info('transferTipMosaicTransaction.transactionHttp.announceTransaction.subscribe.err:');
			logger.info(err);
		}
	)
}

//XEM送金
function transferTipTransaction(user_name,address,amount,mosaic,message,success_message){

	//送金元アカウント生成
	const brainPassword =  new BrainPassword(SYSTEM_PRIVATE_KEY + user_name)
	const brainWallet = BrainWallet.create("TipSLACK", brainPassword);

	const transferTransaction  = TransferTransaction.create(
	    TimeWindow.createWithDeadline(),
	    new Address(address),
	    new XEM(amount),
	    PlainMessage.create(message)
	);

	let account = Account.createWithPrivateKey(brainWallet.unlockPrivateKey(brainPassword));
	let signedTransaction = account.signTransaction(transferTransaction);

	const transactionHttp = new TransactionHttp();
	transactionHttp.announceTransaction(signedTransaction)
	.subscribe(
		value => {
			announce( "<@" +user_name + "> さんのリクエスト結果：\n" + value.message);
			logger.info('transferTipTransaction.transactionHttp.announceTransaction.subscribe.announce:');
			logger.info(value);
		},
		err => {
			announce( "<@" +user_name + "> さんのリクエスト結果：\n" + err.toString());
			logger.info('transferTipTransaction.transactionHttp.announceTransaction.subscribe.err:');
			logger.info(err);
		}
	);
}
