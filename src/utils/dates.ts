export function getYesterdayDate() {
  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1); 

  let year = yesterday.getFullYear();
  let month = ('0' + (yesterday.getMonth() + 1)).slice(-2); 
  let day = ('0' + yesterday.getDate()).slice(-2); 

  return `${year}-${month}-${day}`; 
}