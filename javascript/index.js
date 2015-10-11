$(document).ready(function() {
	console.log("Page Loaded");

	$('#about').hide();

	$("#Snipify").click(function() {
		console.log("inside submit button")
		var url = $("#url-holder").val()
		var key = "";
		var keep = false;
		for(i = 0; i < url.length; i++) {
			if(url.charAt(i) == "v" && url.charAt(i + 1) == "=") {
				keep = true;
				i += 2;
			}
			if(keep == true) {
				key += url.charAt(i)
			}
		}

		getTranscript(key)

	});

})

function postToServer(myURL, myObject, mySuccess, myFailure) {
	$.ajax({
		 url: myURL,
		 data: myObject,
		 success: function(response) {
			 mySuccess(response)
		 },
		 error: function(xhr, status, error) {
			 myFailure(xhr, status, error)
		 },
		 dataType: "xml",
		 type: "GET"
	});
}

function getTranscript(key) {
	var url = "http://video.google.com/timedtext";
	var data = {"lang": "en", "v": key}
	postToServer(url,
		data,
		function(response) {
			window.xmldoc = response;
			convertXML();
		},
		function(xhr, status, error) {
			alert("Please enter a valid Youtube URL");
		})
}

// Use double quotes on input text to be safe
function getTextData(inputText, dictionary, list_sentences, findTime){
	var relationships_url = "http://access.alchemyapi.com/calls/text/TextGetRelations";
	var entities_dict = {}

	$.post(relationships_url, {
		apikey: '1303953fc56522615a1c71880023e185263c2555',
		outputMode: 'json',
		text: inputText,
		maxRetrieve: '250',
		entities: '1',
		requireEntities: '1',
	}, function(JSON, status) {
		var ents = [];
		for(var i = 0; i < JSON['relations'].length; i++){

			var subject =  (JSON['relations'][i]['subject'] === undefined ? {} : JSON['relations'][i]['subject']);
			var object = (JSON['relations'][i]['object'] === undefined ? {} : JSON['relations'][i]['object']);

			if( subject.hasOwnProperty('entities') || object.hasOwnProperty('entities')){

				if(subject['entities'] === undefined) { ents = object['entities']; }
				else if(object['entities'] === undefined) { ents = subject['entities']; }
				else{ ents = subject['entities'].concat(object['entities']); }

				for(var j = 0; j < ents.length; j++){
					if(entities_dict.hasOwnProperty(ents[j]['text'])){
						if(entities_dict[ents[j]['text']]['sentences'].indexOf(JSON['relations'][i]['sentence']) == -1){
							entities_dict[ents[j]['text']]['sentences'].push({
								text: fuzzyMatch(JSON['relations'][i]['sentence'], list_sentences(dictionary)),
								time: findTime(fuzzyMatch(JSON['relations'][i]['sentence'], list_sentences(dictionary)), dictionary),
							});
						}
					}
					else{
						entities_dict[ents[j]['text']] = {'sentences' : [{
							text: fuzzyMatch(JSON['relations'][i]['sentence'], list_sentences(dictionary)),
							time: findTime(fuzzyMatch(JSON['relations'][i]['sentence'], list_sentences(dictionary)), dictionary),
						}]};
					}
				}
			}
		}

	function wikiCall(word, j){
		$.ajax({
			 type: "GET",
			 url: "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects&titles=" + word + "&callback=?",
			 contentType: "application/json; charset=utf-8",
			 async: false,
			 dataType: "json",
			 success: function (data, textStatus, jqXHR) {
					 var queries = data["query"]["pages"];
					 for(key in queries){

							if(data["query"]["pages"].hasOwnProperty(key)){
								 dataString = data["query"]["pages"][key]["extract"];
								 dataStringEdited = dataString.split(".");
								 var string = "";
								 for(var i = 0; i < 3; i++){
									 string += dataStringEdited[i] + ". ";
								 }
								 if(dataStringEdited[0].indexOf("may refer to") >= 0){
									 string = "https://en.wikipedia.org/wiki/" + word
								 }
							}
					 }
					 $('#entity-data').append("<div class='list-group'> <a id='entity'" + j.toString() + " class='list-group-item'><h4 class='list-group-item-heading'>" + word + "</h4><p class='list-group-item-text'>" + string + "</p></a></div>");
					//  $('#entity' + j.toString()).find('h4').text(word);
					 console.log(string);
					//  $('#entity' + j.toString()).find('p').val(string);
			 },
			 error: function (errorMessage) {
			 }
	 });
 }
		// do stuff with the entities_dict data
		var relevance = [];
		var total = 0;
		for(key in entities_dict){
			if(entities_dict.hasOwnProperty(key)){
				total += entities_dict[key]['sentences'].length;
			}
		}

		for(key in entities_dict){
			relevance.push([key, entities_dict[key]['sentences'].length / total * 100]);
		}

		for(var i = 0; i < relevance.length; i++){
			wikiCall(relevance[i][0], i+1)
		}

		console.log(relevance);

		$('#about').show();

		var chart = c3.generate({
			bindto: '#chart',
	    data: {
	        columns: relevance,
	        type : 'donut',
	        onmouseover: function (d, i) { console.log("onmouseover", d, i); },
	    },
	    donut: {
	        title: "Relevance of Keywords"
	    }
		});


	});

}


function convertXML() {
	openLinks(['http://www.google.com', 'http://www.nfl.com']);
	console.log(window.xmldoc)
	var data = window.xmldoc.getElementsByTagName("text")
	var superList = []
	for(item in data) {
		var temp = {}
		try {
			temp["Text"] = escapeHtml(data[item].textContent)
			temp["StartTime"] = data[item].getAttribute("start")
			temp["Duration"] = data[item].getAttribute("dur")
		}
		catch(err) {
			console.log(err)
		}
		superList.push(temp)
	}

	superList2 = []
	tempObj = {}
	for(item in superList) {
		try {
			var tempText = superList[item]["Text"]
			isComplete = false

			for(i = 0; i < tempText.length; i++) {
				if(tempText.charAt(i) == ".") {
					isComplete = true;
				}
			}

			if(isComplete) {
				if(tempObj["Text"] == null) {
					tempObj["Text"] = ""
				}
				tempObj["Text"] += tempText
				tempObj["Duration"] += superList[item]["dur"]
				if(tempObj["StartTime"] == null) {
					tempObj["StartTime"] = superList[item]["StartTime"]
				}
				superList2.push(tempObj)
				tempObj = {}
			}
			else {
				if(tempObj["Text"] == null) {
					tempObj["Text"] = ""
				}
				tempObj["Text"] += tempText + " "
				tempObj["Duration"] += superList[item]["dur"]
				if(tempObj["StartTime"] == null) {
					tempObj["StartTime"] = superList[item]["StartTime"]
				}
			}
		}
		catch(err) {
			console.log(err)
		}
	}
	getTextData(cleanText(concatText(superList2)), superList2, listSentences, findtimes);
}

function cleanText(str) {
	return str.replace(/\n/g, ' ');
}

// takes a list of dicationarys and returns concatenated text
function concatText(superlist){
	result = '';
	for(var i = 0; i < superlist.length; i++){
		result = result + superlist[i]["Text"] + ' ';
	}
	return result;
}

//takes a list of dictionarys and returns list of all sentences
function listSentences(superlist){
	return superlist.map(function(elem) { return elem["Text"]; });
}

function findtimes(sentence, superlist){
	for(var i = 0; i < superlist.length-1; i++){
		if(superlist[i]["Text"] === sentence){
			return [superlist[i]["StartTime"], superlist[i+1]["StartTime"] - superlist[i]["StartTime"]];
		}
	}
}

function escapeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value.replace(/(?:\r\n|\r|\n)/g, ' ');
}

// ------------------------------------------------ do not modify code below
var i = 0;
var currentTab = null;
function openLinks(links){
	setInterval(function(){openLink(links.length, links[i++]);}, 5000); // Wait 5 seconds
}

function openLink(len, link){
	if (i<=len){
   currentTab = window.open(link);
	 setInterval(function(){closeLink(currentTab);}, 4000);
 	}
}

function closeLink(currentTab){
	currentTab.close()
}


// function openLinks(links) {
// 	for (var i = 0; i < links.length; i++){
// 		setTimeout(function (){window.open(links[i], "_self");}, 3000);
// 		// test = ['http://www.google.com', 'http://www.nfl.com']
// 		// setTimeout(function (){alert('naga');}, 3000);
// 	}
// }
