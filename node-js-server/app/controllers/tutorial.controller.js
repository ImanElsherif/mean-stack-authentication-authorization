const db = require("../models");
const Tutorial = db.tutorials;
const admin = require('firebase-admin');

// Path to your Firebase service account key JSON file
const serviceAccount = require('../../../sw-2-313b8-firebase-adminsdk-uqhib-7b3dc51997.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

function sendFCMNotification(title, body, token) {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: token,
  };

  admin.messaging().send(message)
    .then(response => {
      console.log('Notification sent successfully:', response);
    })
    .catch(error => {
      console.error('Error sending notification:', error);
    });
}

function calculateEndTime(hours, movieTime) {
  if (!hours || !movieTime) {
    return '';
  }

  var hoursInMinutes = parseInt(hours.split(':')[0]) * 60 + parseInt(hours.split(':')[1]);
  var movieTimeInMinutes = movieTime;
  var totalMinutes = hoursInMinutes + movieTimeInMinutes;
  var endHours = Math.floor(totalMinutes / 60);
  var endMinutes = totalMinutes % 60;
  return ('0' + endHours).slice(-2) + ':' + ('0' + endMinutes).slice(-2);
}

exports.create = (req, res) => {
  if (!req.body.title) {
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }

  const ShowTime = req.body.ShowTime.map(ShowTime => ({
    date: ShowTime.date,
    hours: ShowTime.hours,
    endTime: calculateEndTime(ShowTime.hours, req.body.MovieTime),
    totalBookedSeats: 0, // Initialize totalBookedSeats to 0
    bookedSeats: [] // Initialize bookedSeats array to empty
  }));

  const tutorial = new Tutorial({
    title: req.body.title,
    description: req.body.description,
    MovieTime: req.body.MovieTime,
    ShowTime: ShowTime,
    published: req.body.published ? req.body.published : false,
    cinemas: req.body.cinemas,
    vendorID: req.body.vendorID,
  });

  tutorial
    .save(tutorial)
    .then(data => {
      // sendFCMNotification("New Tutorial Added!", `A new tutorial "${req.body.title}" has been added.`, 'c2gvajlLxmSG6fCcleqjGa:APA91bE8lH8aLm6DlsWvmTpPhOqs9kIbhtIW5Pb_9NVEEtm7q0ELDH1N0t-VhaKaGVoGFiOV78tPBcL3ZrKmFnlEJ6YRKxLdDznfw4crgxi439qpRkhqfihfgSfGFJI3J_Jvi1BL94S4');
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Tutorial."
      });
    });
};

// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {
  const title = req.query.title;
  var condition = title ? { title: { $regex: new RegExp(title), $options: "i" } } : {};

  Tutorial.find(condition)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving tutorials."
      });
    });
};
exports.findAllByVendorID = (req, res) => {
  const vendorID = req.query.vendorID;
  var condition = vendorID ? { vendorID  } : {};

  Tutorial.find(condition)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving movies."
      });
    });
};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Tutorial.findById(id)
    .then(data => {
      if (!data)
        res.status(404).send({ message: "Not found Tutorial with id " + id });
      else res.send(data);
    })
    .catch(err => {
      res
        .status(500)
        .send({ message: "Error retrieving Tutorial with id=" + id });
    });
};

// Update a Tutorial by the id in the request
exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!"
    });
  }

  const id = req.params.id;

  const ShowTime = req.body.ShowTime.map(ShowTime => ({
    date: ShowTime.date,
    hours: ShowTime.hours,
    endTime: calculateEndTime(ShowTime.hours, req.body.MovieTime),
    totalBookedSeats: ShowTime.totalBookedSeats || 0,
    bookedSeats: ShowTime.bookedSeats || []
  }));

  const selectedCinemas = req.body.cinemas || [];

  Tutorial.findById(id)
    .then(existingTutorial => {
      if (!existingTutorial) {
        res.status(404).send({
          message: `Cannot update Tutorial with id=${id}. Tutorial not found!`
        });
        return;
      }

      existingTutorial.title = req.body.title;
      existingTutorial.description = req.body.description;
      existingTutorial.MovieTime = req.body.MovieTime;
      existingTutorial.ShowTime = ShowTime;
      existingTutorial.cinemas = selectedCinemas;
      existingTutorial.published = req.body.published;

      existingTutorial.save()
        .then(data => {
          res.send({ message: "Tutorial was updated successfully.", data });

          if (req.body.published) {
            sendFCMNotification("New Tutorial Published!", `A new tutorial "${req.body.title}" has been published.`, 'c2gvajlLxmSG6fCcleqjGa:APA91bE8lH8aLm6DlsWvmTpPhOqs9kIbhtIW5Pb_9NVEEtm7q0ELDH1N0t-VhaKaGVoGFiOV78tPBcL3ZrKmFnlEJ6YRKxLdDznfw4crgxi439qpRkhqfihfgSfGFJI3J_Jvi1BL94S4');
          }
        })
        .catch(err => {
          res.status(500).send({
            message: "Error updating Tutorial with id=" + id
          });
        });
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Tutorial with id=" + id
      });
    });
};

// Delete a Tutorial with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Tutorial.findByIdAndRemove(id, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `Cannot delete Tutorial with id=${id}. Maybe Tutorial was not found!`
        });
      } else {
        res.send({
          message: "Tutorial was deleted successfully!"
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Tutorial with id=" + id
      });
    });
};

// Delete all Tutorials from the database.
exports.deleteAll = (req, res) => {
  Tutorial.deleteMany({})
    .then(data => {
      res.send({
        message: `${data.deletedCount} Tutorials were deleted successfully!`
      });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all tutorials."
      });
    });
};
exports.deleteAllByVendorID = (req, res) => {
  const vendorID = req.query.vendorID;
  var condition = vendorID ? { vendorID  } : {};
  Tutorial.deleteMany(condition)
    .then(data => {
      res.send({
        message: `${data.deletedCount} movie were deleted successfully!`
      });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all movie."
      });
    });
};
// Find all published Tutorials
exports.findAllPublished = (req, res) => {
  Tutorial.find({ published: true })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving tutorials."
      });
    });
  
};
exports.findPublishedByVendorID = (req, res) => {
  const vendorID = req.query.vendorID;
  Tutorial.find({ vendorID, published: true })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving tutorials."
      });
    });
};