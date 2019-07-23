const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { mongoose } = require('./db/mongoose');
const { List, Task } = require('./db/models');
/* ROUTE HANDLERS */
/* LIST ROUTES */

//load middleware
app.use(bodyParser.json());

//CORS Header middleware
// app.use(function(req, res, next) {
// 	res.header('Access-Control-Allow-Origin', 'YOUR-DOMAIN.TLD'); // update to match the domain you will make the request from
// 	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
// 	next();
// });
app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id'
	);

	res.header('Access-Control-Expose-Headers', 'x-access-token, x-refresh-token');

	next();
});


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
	List.findOneAndRemove({ _id: req.params.id }).then(removedListDoc => {
		res.send(removedListDoc);
	});
});

//GET /lists/:listId/tasks
//Purpose: Get all task in a specific list
app.get('/lists/:listId/tasks', (req, res) => {
	Task.find({
		_listId: req.params.listId,
	}).then(tasks => {
		res.send(tasks);
	});
});

//POST /lists/:listId/tasks
//Purpose: Get all task in a specific list
app.post('/lists/:listId/tasks', (req, res) => {
	let newTask = new Task({
		title: req.body.title,
		_listId: req.params.listId,
	});
	newTask.save().then(newTaskDoc => {
		res.send(newTaskDoc);
	});
});

//PATCH /lists/:listId/tasks/:id
//Purpose: find and update a task

app.patch('/lists/:listId/tasks/:taskId', (req, res) => {
	Task.findOneAndUpdate(
		{ _id: req.params.taskId },
		{
			$set: req.body,
		}
	).then(() => {
		res.send({message: 'Updated Successfully'});
	});
});

//DELETE /lists/:listId/tasks/:taskId
//Purpose: find and delete a task
app.delete('/lists/:listId/tasks/:taskId', (req, res) => {
	Task.findOneAndRemove({ _id: req.params.taskId }).then(removedTask => {
		res.send(removedTask);
	});
});

//GET /lists/:listId/tasks/:taskId
//Purpose: find one task (not needed)
app.get('/lists/:listId/tasks/:taskId', (req, res) => {
	Task.findOne({ _id: req.params.taskId, _listId: req.params.listId }).then(task => res.send(task));
});
app.listen(3000, () => {
	console.log('Server is listening on port 3000');
});
