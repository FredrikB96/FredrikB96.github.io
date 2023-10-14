let text = '{ "employees" : [' +
'{ "firstName":"John" , "lastName":"Doe" },' +
'{ "firstName":"Anna" , "lastName":"Smith" },' +
'{ "firstName":"Peter" , "lastName":"Jones" } ]}';

function random(num) {
    const obj = JSON.parse(text);
    console.log(obj);
    return obj.employees[num].firstName;
}