
// đây là biến cố định nên dung const
const task = [
    {
    id: 1,
    text: "Tạo cho tôi một file pdf về cach học code ",
    status: "pending",
    time: 36000 
},
    {
    id: 2,
    text: "Hãy tạo cho tôi 1 cái trang web ",
    status: "pending",
    time: 660000
}
]
console.log(task[0].status)
task[0].status = "completed"
console.log(task[0].status)