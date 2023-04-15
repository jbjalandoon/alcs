const Room = require("../../models/room");
const validator = require("validator");
const readXlsxFile = require("read-excel-file/node");

exports.get = async (req, res, next) => {
  try {
    const room = await Room.find({ deleted: false });
    if (room.length === 0)
      return res.status(404).json({ msg: "No available room" });

    return res.status(200).json({ room });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await Room.findOne({ _id: id });

    if (!room) return res.status(404).json({ msg: "Room not found" });

    res.status(200).json({ room });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.post = async (req, res, next) => {
  try {
    const { roomName, isLaboratory } = req.body;

    const existingRoom = await Room.findOne({ roomName, deleted: true });
    let newRoom;
    if (existingRoom) {
      existingRoom = {
        ...existingRoom,
        roomName,
        isLaboratory,
        deleted: false,
      };
      newRoom = await existingRoom.save();
    } else {
      newRoom = await new Room({ roomName, isLaboratory }).save();
    }

    res.status(201).json({ msg: "Room successfully added", room: newRoom });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.edit = async (req, res, next) => {
  try {
    const { roomName, isLaboratory } = req.body;
    const { id } = req.params;
    const room = await Room.findOneAndUpdate(
      { _id: id },
      { roomName, isLaboratory },
      { new: true }
    );

    res.status(200).json({ msg: "Room successfully edited", room });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await Room.findOneAndUpdate({ _id: id }, { deleted: true });

    res.status(200).json({ msg: "Room successfully deleted", room });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.postSpreadsheet = (req, res, next) => {
  // try {
  //   const { buffer } = req.file;
  //   const rows = await readXlsxFile(Buffer.from(buffer));
  //   rows.forEach((e, i) => {
  //     const roomName = e[0];
  //     const isLaboratory = e[1];
  //   });
  // } catch (error) {
  //   res.status(500).json({ msg: "Something went wrong" });
  // }
  let data;
  readXlsxFile(Buffer.from(req.file.buffer))
    .then((rows) => {
      rows.shift();
      // rows.map((element) => {
      //   return {
      //     updateOne: {
      //       filter: { courseCode: e.courseCode },
      //       update: e,
      //       upsert: true,
      //     },
      //   };
      //   return {
      //     roomName: element[0],
      //     laborator: element[1] === "TRUE" ? true : false,
      //   };
      // });
      return Room.bulkWrite(
        rows.map((element) => {
          return {
            updateOne: {
              filter: { roomName: element[0] },
              update: {
                roomName: element[0],
                laboratory: element[1],
              },
              upsert: true,
            },
          };
        })
      );
    })
    .then((result) => {
      return Room.find({ deleted: false });
    })
    .then((result) => {
      res.json({ status: 201, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};
