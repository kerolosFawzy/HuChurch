import mongoose from 'mongoose';

mongoose.connect(
  'mongodb+srv://hurgadachurch:987456321.0Church@church.oldj2zx.mongodb.net/church?retryWrites=true&w=majority',
  { useNewUrlParser: true }
);
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const PersonSchema = new Schema({
  id: ObjectId,
  Fname: { type: String, min: 3 },
  Rname: { type: String, min: 3 },
  date: Date,
  email: { type: String },
  phone: { type: String, min: 11 },
  ChName: { type: String, min: 3 },
  city: { type: String, min: 3 },
  area: { type: String, min: 3 },
  street: { type: String, min: 3 },
});

const UserSchema = new Schema({
  id: ObjectId,
  name: { type: String, min: 3 },
  phone: { type: String, min: 11 },
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true },
});

export const PersonModel = mongoose.model('Person', PersonSchema);
export const AdminModel = mongoose.model('admins', UserSchema);
