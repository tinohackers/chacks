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
	alert(key)
	var data = {"lang": "en", "v": key}
	postToServer(url, 
		data, 
		function(response) {
			console.log(response)
			alert("success"); 
		}, 
		function(xhr, status, error) { 
			console.log(xhr)
			console.log(status)
			console.log(error.responseText) 
			alert("failure"); 
		})
}



