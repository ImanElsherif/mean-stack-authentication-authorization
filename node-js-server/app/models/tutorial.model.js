module.exports = mongoose => {

  var schema = mongoose.Schema(
    {
      title: String,
      description: String,
      published: Boolean,
      MovieTime: Number,
      ShowTime: [
        {
          date: String , // change the type and default value to string
          hours: String,
          endTime: String,
          totalBookedSeats: Number,
          bookedSeats: { type: [Number], default: [] }
        }
      ],
      cinemas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'cinema' }],// Add this line
      vendorID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }// Add this line
      

    },
    { timestamps: true }
  );



  schema.method("toJSON", function() {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });


  const Tutorial = mongoose.model("tutorial", schema);
  return Tutorial;
};