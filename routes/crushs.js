var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var crushs = require('../models/crush');

var router = express.Router();
router.use(bodyParser.json());
var Verify = require('./verify');
router.route('/')
    .get(Verify.verifyOrdinaryUser, function (req, res, next) {
        crushs.find({
                to: req.decoded._id
            })
            .populate('from')
            .populate('to')
            .populate('msg.from')
            .exec(function (err, crushs) {
                if (err) next(err);
                res.json(crushs);
            });
    })

    .post(Verify.verifyOrdinaryUser, function (req, res, next) {
        crushs.create(req.body, function (err, crush) {
            if (err) next(err);
            console.log('crush created!');
            var id = crush._id;
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });

            res.end('Added the crush with id: ' + id);
        });
    })

    .delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function (req, res, next) {
        crushs.findByIdAndRemove(req.params.userId, function (err, resp) {
            if (err) next(err);
            res.json(resp);
        });
    });
router.route('/:crushId/msg')
    .all(Verify.verifyOrdinaryUser)

    .get(function (req, res, next) {
        crushs.findById(req.params.crushId)
            .populate('msg.from')
            .exec(function (err, crush) {
                if (err) next(err);
                res.json(crush.msg);
            });
    })

    .post(function (req, res, next) {
        crushs.findById(req.params.crushId).populate('msg.from').exec(function (err, crush) {
            if (err) next(err);
            req.body.from = req.decoded._id;
            console.log(req.body)
            crush.msg.push(req.body);
            crush.save(function (err, crush) {
                if (err) next(err);
                console.log('Updated msg!');
                res.json(crush.msg);
            });
        });
    })

    .delete(function (req, res, next) {
        crushs.findById(req.params.crushId, function (err, crush) {
            if (err) next(err);
            for (var i = (crush.msg.length - 1); i >= 0; i--) {
                crush.msg.id(crush.msg[i]._id).remove();
            }
            crush.save(function (err, result) {
                if (err) next(err);
                res.writeHead(200, {
                    'Content-Type': 'text/plain'
                });
                res.end('Deleted all msg!');
            });
        });
    });


router.route('/:crushId/msg/:commentId')
    .all(Verify.verifyOrdinaryUser)

    .get(function (req, res, next) {
        crushs.findById(req.params.crushId)
            .populate('msg.from')
            .exec(function (err, crushId) {
                if (err) next(err);
                res.json(crush.msg.id(req.params.commentId));
            });
    })

    .put(function (req, res, next) {
        // We delete the existing commment and insert the updated
        // comment as a new comment
        crushs.findById(req.params.crushId, function (err, crush) {
            if (err) next(err);
            crush.msg.id(req.params.commentId).remove();
            req.body.from = req.decoded._id;
            crush.msg.push(req.body);
            crush.save(function (err, crush) {
                if (err) next(err);
                console.log('Updated msg!');
                res.json(crush);
            });
        });
    })

    .delete(function (req, res, next) {
        crushs.findById(req.params.crushId, function (err, crush) {
            if (crush.msg.id(req.params.commentId).from !=
                req.decoded._id) {
                var err = new Error('You are not authorized to perform this operation!');
                err.status = 403;
                return next(err);
            }
            crush.msg.id(req.params.commentId).remove();
            crush.save(function (err, resp) {
                if (err) next(err);
                res.json(resp);
            });
        });
    });
module.exports = router;
