const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { mongoose } = require('./db/mongoose');
const { List, Task } = require('./db/models');
/* ROUTE HANDLERS */
/* LIST ROUTES */

//load middleware
app.use(bodyParser.json());

//GET /lists
//Purpose: Get all List
app.get('/lists', (req, res) => {
	// want to return an array of all the list in the db
	List.find({}).then(lists => {
		res.send(lists);
	});
});

//POST /lists
//Purpose: Create a new list
app.post('/lists', (req, res) => {
	let title = req.body.title;
	let newList = new List({
		title,
	});
	newList.save().then(listDoc => {
		res.send(listDoc);
	});
});

//PATCH /lists/:id
//Purpose: Update/edit a list

app.patch('/lists/:id', (req, res) => {
	List.findOneAndUpdate(
		{ _id: req.params.id },
		{
			$set: req.body,
		}
	).then(() => {
		res.sendStatus(200);
	});
});

//DELETE /lists/:id
//Purpose: Delete a list

app.delete('/lists/:id', (req, res) => {
	List.findOneAndRemove({ _id: req.params.id }).then((removedListDoc) => {
		res.send(removedListDoc);
	});
});

//GET /lists/:listId/tasks
//Purpose: Get all task in a specific list
app.get('/list/:listId/tasks', (req,res) => {
  Task.find({
    _listId: req.params.listId
  }).then((tasks) => {
    res.send(tasks)
  })
})

//POST /lists/:listId/tasks
//Purpose: Get all List
app.get('/list/:listId/tasks', (req,res) => {
  Task.find({
    _listId: req.params.listId
  }).then((tasks) => {
    res.send(tasks)
  })
})

app.listen(3000, () => {
	console.log('Server is listening on port 3000');
});
