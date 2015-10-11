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
		sentiment: '1',
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
						if(!(contains(entities_dict[ents[j]['text']]['sentences'], fuzzyMatch(JSON['relations'][i]['sentence'], list_sentences(dictionary))))){
							entities_dict[ents[j]['text']]['sentences'].push({
								text: fuzzyMatch(JSON['relations'][i]['sentence'], list_sentences(dictionary)),
								time: findTime(fuzzyMatch(JSON['relations'][i]['sentence'], list_sentences(dictionary)), dictionary),
								sentiment: object['sentiment'],
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
		console.log(entities_dict);

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


					 function cutSpace(text){
						 return text.replace(/\s/g, '');
					 }

					var wiki = "https://en.wikipedia.org/wiki/" + word;
					var dropdown = "<div style='padding-top:10px' class='btn-group'><button type='button' class='btn btn-primary dropdown-toggle' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'> Relevant Links to " + word + " <span class='caret'></span></button><ul id='" + cutSpace(word) +  "' class='dropdown-menu'></ul></div>"
					$('#entity-data').append("<div class='list-group'> <a id='entity" + j.toString() + "' class='list-group-item'><h4 class='list-group-item-heading'>" + word + "</h4><p class='list-group-item-text'>" + string + "</p></a>" + dropdown + "</div>");

					function extract(text){
						var result = '';
						var tokens = text.match(/\S+/g);
						for(var i = 0; i < 15; i++){
							if(i < tokens.length){
								result += tokens[i] + ' ';
							}
						}
						if(tokens.length > 15){
							result += '[...]';
						}
						return "\"" + result + "\"";
					}

					var pre_links = entities_dict[word]['sentences'];
					var base_url = $('#url-holder').val();
					for(var i = 0; i < pre_links.length; i++){
						var start = Math.floor(parseInt(pre_links[i]['time'][0])).toString();
						var duration = Math.ceil(parseInt(pre_links[i]['time'][1])).toString();
						var url = base_url + '&t=' + start;
						$('#' + cutSpace(word)).append("<li><a href='" + url + "'>" + extract(pre_links[i]['text']) + " <b>" + duration  + " seconds</b> </a></li>");
					}
					$('#' + cutSpace(word)).append("<li><a href='" + wiki + "'> <i>Further Reading</i></a></li>");
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

		sentiments = [];

		for(key in entities_dict){
			var sents = [];
			var s_times = [];
			for(var i = 0; i < entities_dict[key]['sentences'].length; i++){
				if(entities_dict[key]['sentences'][i]['sentiment'] !== undefined){
					sents.push(parseFloat(entities_dict[key]['sentences'][i]['sentiment']['score']));
					s_times.push(parseFloat(entities_dict[key]['sentences'][i]['time'][0]));
				}
			}
			if(sents.length >= 3){
				var temp = {};
				temp[key] = [sents, s_times];
				sentiments.push(temp);
			}
		}

		console.log(sentiments);

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

		for(var i = 0; i < sentiments.length; i++){
			$('#special').append("<div id='sentiment" + i.toString() + "'></div> ");
		}

		for(var i = 0; i < sentiments.length; i++){
			for(key in sentiments[i]){
				if(sentiments[i].hasOwnProperty(key)){
					var emots = sentiments[i][key][0];
					var times = sentiments[i][key][1];
					var l = c3.generate({
						bindto: '#sentiment' + i.toString(),
						data: {
							xs: {
								'sentiment': 'time',
							},
							columns: [
								['time'].concat(times),
								['sentiment'].concat(emots),
							]
						}
					});
				}
			}
		}

		// var l = c3.generate({
		// 	bindto: '#sentiment0',
		// 	data: {
		// 			xs: {
		// 					'data1': 'x1',
		// 					'data2': 'x2',
		// 			},
		// 			columns: [
		// 					['x1', 10, 30, 45, 50, 70, 100],
		// 					['x2', 30, 50, 75, 100, 120],
		// 					['data1', 30, 200, 100, 400, 150, 250],
		// 					['data2', 20, 180, 240, 100, 190]
		// 			]
		// 	}
		// });

		// for(var i = 0; i < sentiments.length; i++){
		// 	var sentiment0 = c3.generate({
		// 		bindto: '#sentiment0',
		// 		data: {
		// 				xs: {
		// 						'data1': 'x1',
		// 						'data2': 'x2',
		// 				},
		// 				columns: [
		// 						['x1', 10, 30, 45, 50, 70, 100],
		// 						['x2', 30, 50, 75, 100, 120],
		// 						['data1', 30, 200, 100, 400, 150, 250],
		// 						['data2', 20, 180, 240, 100, 190]
		// 				]
		// 		}
		// 	});
		// }

	});

}


function convertXML() {
	//openLinks(['http://www.google.com', 'http://www.nfl.com']);
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

function contains(objectArray, str){
	for(var i = 0; i < objectArray.length; i++){
		if((objectArray[i]['text']).indexOf(str) > -1){
			return true;
		}
	}
	return false;
}

function escapeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value.replace(/(?:\r\n|\r|\n)/g, ' ');
}
