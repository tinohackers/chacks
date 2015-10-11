function fuzzyMatch(sentence, listSentences){
  var tokens = sentence.match(/\S+/g);
  var max = 0;
  var ans = '';
  for(var i = 0; i < listSentences.length; i++){
    temp = 0;
    for(var j = 0; j < tokens.length; j++){
      if(listSentences[i].indexOf(tokens[j]) > -1){
        temp++;
      }
    }
    if(temp > max){
      max = temp;
      ans = listSentences[i];
    }
  }
  return ans;
}
