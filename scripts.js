const Modal = {
    open(formType, index){
        Form.formSettings(formType)
        Form.formValues(formType, index)
        if(formType=='simple' || formType=='installments' || formType=='edit' || formType=='view'){
            document
                .querySelector('.modal-overlay.transaction')
                .classList
                .add('active')
        }
        else if (formType=='filter'){
            document
                .querySelector('.modal-overlay.filter')
                .classList
                .add('active')
        }

    },
    
    openEdit(index){
        transaction=Transaction.all[index]  
        document
            .querySelector('.modal-overlay.edit')
            .classList
            .add('active')
    },

    close(){
        document
            .querySelector('.modal-overlay.active')
            .classList
            .remove('active')
        Form.clearFields()
    }
}

const Storage = {
    get(origin) {
        if (origin=='transaction'){
            return JSON.parse(localStorage.getItem("dev.finances:transactions")) || []
        }
        else if (origin=='filter'){
            return JSON.parse(localStorage.getItem("dev.finances:filter")) || []
        }
        else if (origin=='theme'){
            return JSON.parse(localStorage.getItem("dev.finances:theme")) || []
        }        
    },
    set(destination, values) {
        if (destination=='transaction'){
            localStorage.setItem("dev.finances:transactions", JSON.stringify(values))
        }
        else if (destination=='filter'){
            localStorage.setItem("dev.finances:filter", JSON.stringify(values))
        }
        else if (destination=='theme'){
            localStorage.setItem("dev.finances:theme", JSON.stringify(values))
        }
    },
    delete(target){
        if (target=='filter'){
            localStorage.removeItem("dev.finances:filter")
        }
    }
}

const Transaction = {
    all: Storage.get('transaction'),
    
    add(transaction){
        
        indexAdd=0
        while (indexAdd<transaction.installments){
            if(Transaction.all.length==0){
                transaction.index=1
            }
            else{
                transaction.index=lastIndex=Transaction.all[Transaction.all.length-1].index+1
            }
            transaction.installment=indexAdd+1
            transaction.date=Utils.checkDate(transaction.date,indexAdd)
            Transaction.all.push(transaction)
            indexAdd++
        }
        return Transaction.all

    },

    edit(transaction) {
        indexOfTransaction=transaction.position
        finalTransaction={
            'description': transaction.description,
            'amount': transaction.amount,
            'date': transaction.date,
        }
        Transaction.all.splice(indexOfTransaction, 1, finalTransaction)

        
        
    },

    remove(index) {
        Transaction.all.splice(index, 1)
        
        App.init()
    },

    incomes(transactionsToScreen) {
        let income = 0;
        transactionsToScreen.forEach(transaction => {
            if( transaction.amount > 0 ) {
                income += transaction.amount;
            }
        })
        return income;
    },

    expenses(transactionsToScreen) {
        let expense = 0;
        transactionsToScreen.forEach(transaction => {
            if( transaction.amount < 0 ) {
                expense += transaction.amount;
            }
        })
        return expense;
    },

    total(transactionsToScreen) {
        return Transaction.incomes(transactionsToScreen) + Transaction.expenses(transactionsToScreen);
    }
}

const Filter = {
    filter: Storage.get('filter'),

    add(filter){
        Storage.set('filter', filter) 

    },

    update(filter){
        Storage.delete('filter')
        Storage.set('filter', filter) 
    },
}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),
    footerContainer: document.querySelector('#data-table tfoot'),

    addTransaction(transaction, index) {
        const tr = document.createElement('tr')
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
        tr.dataset.index = index
        DOM.transactionsContainer.appendChild(tr)
    },

    addFooter(currencyPage, lastPage){
        const tr = document.createElement('tr')
        tr.innerHTML = DOM.innerHTMLTableFooter(currencyPage, lastPage)
        DOM.footerContainer.appendChild(tr)
    },

    innerHTMLTableFooter(currencyPage, lastPage){
        html = `<th colspan=4>`
        backPage=currencyPage-1
        nextPage=currencyPage+1

        if (currencyPage<2){
            html = html+`<< < `
        }
        else{
            html = html+`<a class="page" href="#" onclick="App.navigation(1)"><<</a> <a class="page" href="#" onclick="App.navigation(${backPage})"><</a>`
        }
        html = html+` ${currencyPage} `
        if (currencyPage==lastPage){
            html = html+` > >>`
        }
        else{
            html = html+`<a class="page" href="#" onclick="App.navigation(${nextPage})">></a> <a class="page" href="#" onclick="App.navigation(${lastPage})">>></a>`
        }
        return html
    },

    innerHTMLTransaction(transaction, index) {
        const CSSclass = transaction.amount > 0 ? "income" : "expense"

        const amount = Utils.formatCurrency(transaction.amount)
        const date = Utils.formatDate(transaction.date)

        const html = `
            <td class="description">${transaction.description}</td>
            <td class="${CSSclass}">${amount}</td>
            <td class="date">${date}</td>
            <td class="commands">
                <img onclick="Modal.openEdit(${index})" src="./assets/edit.png" alt="Editar transação">
                <img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remover transação">
            </td>
        `

        return html
    },

    updateBalance(transactionsToScreen) {
        document
            .getElementById('incomeDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.incomes(transactionsToScreen))
        document
            .getElementById('expenseDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.expenses(transactionsToScreen))
        document
            .getElementById('totalDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.total(transactionsToScreen))
    },

    clearTransactions() {
        DOM.transactionsContainer.innerHTML = ""
    },

    clearTableFooter() {
        DOM.footerContainer.innerHTML = ""
    }
}

const Utils = {
    formatAmount(value){
        value = Number(value) * 100
        return Math.round(value)
    },

    formatInt(value){
        value = Number(value) * 1
        return value
    },

    formatCurrency(value) {
        const signal = Number(value) < 0 ? "-" : ""
        value = String(value).replace(/\D/g, "")
        value = Number(value) / 100
        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })
       return signal + value
    },

    formatDate(value) {
        dateInParts=value.split("-")
        date=dateInParts[2]+'/'+dateInParts[1]+'/'+dateInParts[0]
        return date
    },

    checkDate(date, index){
        dateInParts=date.split("-")
        originalMonth=Number(dateInParts[1])
        monthPlusIndex=originalMonth+index
        insertYear=Math.ceil(monthPlusIndex/12)-1
        correctMonth=monthPlusIndex-(insertYear*12)
        correctYear=dateInParts[0]+insertYear

        needCheckDate=true
        tryToCheck=0
        finalDate= new Date()
        
        while (needCheckDate)
        {
            finalDate.setFullYear(correctYear, correctMonth-1, dateInParts[2]-tryToCheck);
            checkDay=finalDate.getDate()
            checkMonth=finalDate.getMonth()
            checkYear=finalDate.getFullYear()
            if ((dateInParts[2]-tryToCheck==checkDay) && (correctMonth-1==checkMonth) && (correctYear==checkYear)){
                break
            }    
            tryToCheck=tryToCheck+1
        }

        correctDay=finalDate.getDate()
        if(correctDay.length<2){
            correctDay='0'+correctDay
        }
        
        correctMonth=finalDate.getMonth()+1
        if(correctMonth.length<2){
            correctMonth='0'+correctMonth
        }
        
        correctYear=finalDate.getFullYear()

        return correctYear+'-'+correctMonth+'-'+correctDay
    },

    checkFilterDate(dateCurrency, dateToCheck, question){
        toReturn=dateCurrency
        if ((question && internalFormatdateToCheck>internalFormatDateCurrency) || (question==false && internalFormatdateToCheck<internalFormatDateCurrency)){
            toReturn=dateToCheck
        }
        return toReturn
    },

    checkTransactionDate(startDate, finalDate, transactionDate){
        if (startDate!='' && transactionDate<startDate){
            return false
        }
        if (finalDate!='' && transactionDate>finalDate){
            return false
        }
        return true
    }
}

const Form = {
    description: document.querySelector('input#description'),
    installments: document.querySelector('input#installments'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),
    index: document.querySelector('input#index'),

    startDate: document.querySelector('input#startDate'),
    finalDate: document.querySelector('input#finalDate'),
    itensPerPage: document.querySelector('input#itensPerPage'),

    formSettings(formType){
        if(formType=='simple' || formType=='edit'){
            document.getElementById('description').disabled = false
            document.getElementById('installments').disabled = true
            document.getElementById('installments').min=String(1)
            document.getElementById('amount').disabled = false
            document.getElementById('date').disabled = false
        }
        else if(formType=='installments'){
            document.getElementById('description').disabled = false
            document.getElementById('installments').disabled = false
            document.getElementById('installments').min=String(2)
            document.getElementById('amount').disabled = false
            document.getElementById('date').disabled = false
        }
        else if(formType=='view'){
            document.getElementById('description').disabled = true
            document.getElementById('installments').disabled = true
            document.getElementById('installments').min=String(1)
            document.getElementById('amount').disabled = true
            document.getElementById('date').disabled = true
        }
    },
    
    formValues(formType, index){
        if(formType=='simple'){
            document.getElementById('installments').value=String(1)
        }
        else if(formType=='edit' || formType=='view'){
            document.getElementById('description').value=String(1)
            document.getElementById('installments').value=String(1)
            document.getElementById('amount').value=String(1)
            document.getElementById('date').value=String(1)
            document.getElementById('index').value=String(1)
        }
        else if(formType=='filter'){
            filter=Filter.filter
            document.getElementById('startDate').value=String(filter.startDate)
            document.getElementById('finalDate').value=String(filter.finalDate)
            document.getElementById('itensPerPage').value=String(filter.itensPerPage)
        }
    },

    getValues(formType){
        if (formType=='simple' || formType=='installments' || formType=='edit'){
            return {
                description: Form.description.value,
                installments: Form.installments.value,
                amount: Form.amount.value,
                date: Form.date.value,
                index: Form.index.value
            }
        }
        else if (formType=='filter'){
            return {
                startDate: Form.startDate.value,
                finalDate: Form.finalDate.value,
                itensPerPage: Form.itensPerPage.value
            }
        }
    },

    validateFields(formType) {
        if (formType=='simple' || formType=='installments' || formType=='edit'){
            const { description, installments, amount, date, index } = Form.getValues(formType)    
            if( description.trim() === "" || 
                installments.trim() === "" || 
                amount.trim() === "" || 
                date.trim() === "" ) 
            {
                throw new Error("Por favor, preencha todos os campos")
            }
        }
        else if (formType=='filter') {
            const { startDate, finalDate} = Form.getValues(formType)

            if (startDate!='' && finalDate!='' && startDate>finalDate){
                throw new Error("Por favor, a data final deve ser superior a data inicial.")
            }
        }
    },

    formatValues(formType) {
        if (formType=='simple' || formType=='installments' || formType=='edit'){
            let {  description, installments, amount, date, index } = Form.getValues(formType)
            
            installments=Utils.formatInt(installments)
            amount = Utils.formatAmount(amount)
            
            return {
                description,
                installments,
                amount,
                date,
                index
            }

        }
        else if (formType=='filter'){
            let { dateStart, dateEnd, itensPerPage} = Form.getValues(formType)

            itensPerPage=Utils.formatInt(itensPerPage)

            return {
                dateStart,
                dateEnd,
                itensPerPage,
            }
        }
    },

    clearFields() {
        Form.description.value = ""
        Form.installments.value = ""
        Form.amount.value = ""
        Form.date.value = ""
        Form.index.value = ""

        Form.startDate.value = ""
        Form.finalDate.value = ""
        Form.itensPerPage.value = ""
    },

    submit(event, formType) {
        event.preventDefault()
        try {
            Form.validateFields(formType)
            const form = Form.formatValues(formType)
            if (formType=='simple' || formType=='installments' || formType=='edit'){
                transactions=Transaction.add(form)
                Storage.set('transaction', transactions)
            }
            else if (formType=='filter'){
                filter=Filter.filter
                filter={
                    'startDate': startDate,
                    'finalDate': finalDate,
                    'itensPerPage': itensPerPage,
                    'page':filter.page
                }
                Filter.update(filter)
            }

            Modal.close()
            Form.clearFields()
            App.init()
        } catch (error) {
            alert(error.message)
        }
    },

}

const Calculations = { 
    sumTransactions(transactionsToScreen){
        sumIncome=[]
        sumExpense=[]
        sumAll=[]

        indexCount = 0
        lengthTransactions = transactionsToScreen.length
        
        while (indexCount<lengthTransactions) {
            if (transactionsToScreen[indexCount].amount>=0){
                sumIncome=Calculations.checkInList(sumIncome, transactionsToScreen[indexCount].description, transactionsToScreen[indexCount].amount/100)
            }
            else{
                sumExpense=Calculations.checkInList(sumExpense, transactionsToScreen[indexCount].description, transactionsToScreen[indexCount].amount/100)
            }
            indexCount++
        }
        sumAll.push(sumIncome)
        sumAll.push(sumExpense)
        return sumAll
    },

    checkInList(list, description, amount){
        insert=true
        indexCountInCheck = 0
        lengthList=list.length

        while (indexCountInCheck<lengthList){
            if (list[indexCountInCheck][0]==description){
                list[indexCountInCheck][1]=list[indexCountInCheck][1]+amount
                insert=false
                break
            }
            indexCountInCheck++
        }
        if (insert){
            list.push([description, amount])
        }
        return list
    },

    transationsInOrder(startList, maior){
        endList=[]

        indexCount = 0
        lengthTransactions = startList.length

        while (indexCount<lengthTransactions){
            internalLengthTransactions = endList.length

            if (internalLengthTransactions==0){
                endList.push(startList[indexCount])
            }

            else{
                internalIndexCount = 0
                while (internalIndexCount<internalLengthTransactions){  
                    if (maior){
                        if (endList[internalIndexCount][1]<startList[indexCount][1]){
                            break;
                        }
                    }
                    else {
                        if (endList[internalIndexCount][1]>startList[indexCount][1]){
                            break;
                        }
                    }
                    internalIndexCount++
                }
                endList.splice(internalIndexCount, 0, startList[indexCount])
            }    
            indexCount++
        }
        return endList;
    }, 
}

const App = {
    init(newSession) {
        filter=Filter.filter
        newFilter={
            'startDate': '',
            'finalDate': '',
            'itensPerPage': 15,
            'page':1
        }
        if (newSession || filter.length==0 ){
            Filter.update(newFilter)
            filter=Filter.filter
        }
        App.navigation()
    },

    navigation(){
        filter=Filter.filter
        
        //calling the transactions in side of filter
        transactions=App.transactionsIntoTheFilter(filter.startDate, filter.finalDate)

        //check the pages and update the filter
        lastPage=Math.ceil(transactions.length/filter.itensPerPage)
        if (filter.page>lastPage){
            filter.page=lastPage
        }
        Filter.update(filter)

        //checking the itens to the user's page
        startTransation=filter.itensPerPage*(filter.page-1)
        finalTransation=filter.itensPerPage*filter.page

        //catching the transactions to user's page
        transactionsToPage=transactions.slice(startTransation,finalTransation)

        //cleaning the user's page
        DOM.clearTransactions()
        DOM.clearTableFooter()

        //working to show the informations
        indexToPage=0
        while(indexToPage<transactionsToPage.length){
            DOM.addTransaction(transactionsToPage[indexToPage],startTransation+indexToPage)
            indexToPage++
        }
        DOM.addFooter(filter.page, lastPage)
    },

    transactionsIntoTheFilter(){
        filter=Filter.filter

        //all transactions
        transactions=Transaction.all

        //working to check the transactions
        transactionsIntoTheFilter=[]
        transactionIndex=0
        while (transactionIndex<transactions.length){
            if(Utils.checkTransactionDate(startDate,finalDate,date)){
                transactionsIntoTheFilter.push(transactions[transactionIndex])
            }
            transactionIndex++
        }
        
        //uptdate sums in the screen
        //balance
        DOM.updateBalance(transactionsIntoTheFilter)  
        //base of graphics
        sumIncomeExpense=Calculations.sumTransactions(transactionsIntoTheFilter)
        //the graphics
        google.charts.load('current', {'packages':['corechart']});
        google.setOnLoadCallback(function() { drawChart(true); });
        google.setOnLoadCallback(function() { drawChart(false); });
        google.setOnLoadCallback(drawChartTotal);

        return transactionsIntoTheFilter
    },

}

App.init(true)

function drawChart(graficsBig) {
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Topping');
    data.addColumn('number', 'Slices');
    color=[]
    if (graficsBig){
        title='Entradas (TOP 5)'
        listToGrafics=Calculations.transationsInOrder(sumIncomeExpense[0], graficsBig)
        div='income_chart_div'
        correction=1
        color=['darkgreen','forestgreen','green','lime','chartreuse']
    }
    else{
        title='Saídas (TOP 5)'
        listToGrafics=Calculations.transationsInOrder(sumIncomeExpense[1], graficsBig)
        div='expense_chart_div'
        correction=-1
        color=['DarkRed','Red','Firebrick','IndianRed','LightCoral']
    }

    if (listToGrafics.length>5){
        listToGrafics=listToGrafics.slice(0,5)
    }
    finalIndex=0
    finalLength=listToGrafics.length

    while (finalIndex<finalLength){
        data.addRows([
            [listToGrafics[finalIndex][0], listToGrafics[finalIndex][1]*correction]
        ]);
        finalIndex++
    }
    var options = {
        title: title,
        legend: 'none',
        pieHole: 0.1,
        
        slices: {
            0: { color: color[0] },
            1: { color: color[1] },
            2: { color: color[2] },
            3: { color: color[3] },
            4: { color: color[4] }
          }
    };

    var chart = new google.visualization.PieChart(document.getElementById(div));
    chart.draw(data, options);
}

function drawChartTotal() {
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Topping');
    data.addColumn('number', 'Slices');
    color=[]

    incomesList=Calculations.transationsInOrder(sumIncomeExpense[0], true)
    incomesIndex=0
    incomesLength=incomesList.length
    incomesAmount=0
    while (incomesIndex<incomesLength){
        incomesAmount=incomesAmount+incomesList[incomesIndex][1]
        incomesIndex++
    }
    
    expensesList=Calculations.transationsInOrder(sumIncomeExpense[1], false)
    expensesIndex=0
    expensesLength=expensesList.length
    expensesAmount=0
    while (expensesIndex<expensesLength){
        expensesAmount=expensesAmount+expensesList[expensesIndex][1]*-1
        expensesIndex++
    }


    if (incomesAmount>=expensesAmount){
        title='Carteira SAUDAVEL'
        color=['darkgreen','forestgreen']
        data.addRows([
            ['Saídas do período', expensesAmount]
        ]);
        data.addRows([
            ['Entrada restante', incomesAmount-expensesAmount]
        ]);
    }
    else{
        title='Carteira EM RISCO'
        color=['DarkRed','Red']
        data.addRows([
            ['Entradas do período', expensesAmount]
        ]);
        data.addRows([
            ['Saída restante', expensesAmount-incomesAmount]
        ]);
    }

    var options = {
        title: title,
        legend: 'none',
        pieHole: 0.1,
        
        slices: {
            0: { color: color[0] },
            1: { color: color[1] }
          }
    };

    var chart = new google.visualization.PieChart(document.getElementById('total_chart_div'));
    chart.draw(data, options);
}