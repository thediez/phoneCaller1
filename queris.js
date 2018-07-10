var promise = require('bluebird');

var options = {
    promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connectionString = "postgres://postgres:Radius123@109.188.79.65:5432/hh_resume";
// var connectionString = "postgres://postgres:Radius123@10.0.0.4:5432/hh_resume";
var db = pgp(connectionString);

function getAllCandidatesList(req, res, next) {
    db.any('SELECT json_agg(*) FROM public.resume')
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved ALL candidates list'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getCandidateById(req, res, next) {
    var candidateID = parseInt(req.params.id);
    db.one('SELECT json_agg(*) FROM public.resume WHERE id = $1', candidateID)
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved one candidate'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getCandidatesListBySkill(req, res, next) {
    var candidateID = parseInt(req.params.id);
    db.one('SELECT json_agg(*) FROM public.resume LIKE $1', req.body.skill)
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved ALL candidates with specific skills'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getCandidatesListByAge(req, res, next) {
    var candidateID = parseInt(req.params.id);
    db.one('SELECT json_agg(*) FROM public.resume LIKE $1', req.body.age)
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved ALL candidates with specific age'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getCandidatesListBySalary(req, res, next) {
    var candidateID = parseInt(req.params.id);
    db.one('SELECT json_agg(*) FROM public.resume LIKE $1', req.body.salary)
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved ALL candidates with specific salary'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getCandidateResumeById(req, res, next) {
    var candidateID = parseInt(req.params.id);
    db.one('SELECT json_agg(*) FROM public.resume LIKE $1', parseInt(req.params.id))
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved HTML page of candidate by Id'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function updateComment(req, res, next) {
    db.none('update public.resume set comment=$1 where id=$2',
        [req.body.comment, parseInt(req.params.id)])
        .then(function () {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved ALL puppies'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

// function updatePhoneCallTime(req, res, next) {
//     db.none('update public.resume set comment=$1 where id=$2',
//         [req.body.comment, parseInt(req.params.id)])
//         .then(function () {
//             res.status(200)
//                 .json({
//                     status: 'success',
//                     data: data,
//                     message: 'Retrieved ALL puppies'
//                 });
//         })
//         .catch(function (err) {
//             return next(err);
//         });
// }

module.exports = {
    getAllCandidatesList: getAllCandidatesList,
    getCandidateById: getCandidateById,
    getCandidatesListBySkill: getCandidatesListBySkill,
    getCandidateResumeById: getCandidateResumeById,
    getCandidatesListBySalary: getCandidatesListBySalary,
    getCandidatesListByAge: getCandidatesListByAge,
    updateComment: updateComment
};