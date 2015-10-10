function fuzzyMatch(sentence, listSentences){
  var tokens = sentence.match(/\S+/g);
  var dict = [];
  var max = 0;
  var ans = null;
  for(sent in listSentences){
       temp = 0;
    for(token in tokens){
       if (sent.contains(token)){

         temp ++;
       }

    }
   if(temp > max){
     max = temp;
     ans = listSentences.indexof(sent);
   }

  }

   return ans;
}
