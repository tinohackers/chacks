$(document).ready(function() {
	console.log("Page Loaded")

	$("#submitButton").click(function() {
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
			convertXML()
		},
		function(xhr, status, error) {
			alert("Please enter a valid Youtube URL");
		})
}

// Use double quotes on input text to be safe
function getTextData(inputText){
	var url = "http://access.alchemyapi.com/calls/text/TextGetRankedNamedEntities";

	$.post(url, {
		apikey: '1303953fc56522615a1c71880023e185263c2555',
		outputMode: 'json',
		text: inputText
	}, function(JSON, status) {
		//prints the entitity JSON --> need to parse this 
		console.log(JSON);
	});
}

function convertXML() {
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
	console.log(superList2)
	console.log(concatText(superList2))
	getTextData(concatText(superList2));
}

// takes a list of dicationarys and returns concatenated text
function concatText(superlist){
	result = '';
	for(var i = 0; i < superlist.length; i++){
		result = result + superlist[i]["Text"];
	}
	return result;
}

function escapeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}
