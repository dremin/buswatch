document.addEventListener("DOMContentLoaded", () => {
  // no reason to reinvent the wheel: https://stackoverflow.com/a/49041392
  const getCellValue = (tr, idx) => {
    const text = tr.children[idx].innerText || tr.children[idx].textContent;
    
    if (text && idx > 0 && idx < 3) {
      // date column
      return Date.parse(text);
    }
    
    return text;
  }
  
  const comparer = (idx, asc) => (a, b) => ((v1, v2) => 
      v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2, undefined, {numeric: true, sensitivity: 'base'})
      )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));
  
  // default sort is bus ascending
  this.asc = true;
  
  document.querySelectorAll('th').forEach(th => th.addEventListener('click', (() => {
      const table = th.closest('table');
      console.log(this.asc);
      Array.from(table.querySelectorAll('tr:nth-child(n+2)'))
          .sort(comparer(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
          .forEach(tr => table.appendChild(tr) );
  })));
});