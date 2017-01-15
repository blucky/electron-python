#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pkg_resources
from flask import Flask, render_template, send_from_directory, jsonify
from flask_restful import Resource, Api
from flask_restful.utils import cors
import sys
import datetime

app = Flask(__name__)
api = Api(app)


@app.route("/")
def hello():
    return render_template('index.html')


@app.route('/static/<path:path>')
def send_js(path):
    return send_from_directory('./static', path)


class PythonModuleV1(Resource):

    @cors.crossdomain(origin='*')
    def get(self, module_name):
        retval = None
        module = next(
            (i for i in pkg_resources.working_set
             if i.project_name.lower() == module_name.lower()), None)
        if module:
            return jsonify({"module_name": module.project_name,
                            "version": module.version,
                            "code": "200",
                            "message": "Module Available. OK"})
        else:
            return jsonify({"module_name": "None",
                            "code": "404",
                            "message": "Module Not Found",
                            "errors": {
                                       "resource": module_name}
                            })


class ConfigModuleV1(Resource):

    @cors.crossdomain(origin='*')
    def get(self, attribute_name):
        retval = None
        if "version" == attribute_name:
            retval = sys.version
        if "pypath" == attribute_name:
            retval = sys.executable
        elif "datetime" == attribute_name:
            retval = datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S")
        elif "date" == attribute_name:
            retval = datetime.datetime.now().date().isoformat()
        elif "time" == attribute_name:
            retval = datetime.datetime.now().time().isoformat()

        if retval:
            return jsonify({"attribute": attribute_name,
                            "value": retval,
                            "code": "200",
                            "message": "Attribute Available. OK"})
        else:
            return jsonify({"attribute": "None",
                            "code": "404",
                            "message": "Attribute Not Found",
                            "errors": {
                                       "resource": attribute_name}
                            })

api.add_resource(PythonModuleV1, '/api/v1/module/<string:module_name>')
api.add_resource(ConfigModuleV1, '/api/v1/config/<string:attribute_name>')


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--debug', action='store_true', default=False,
        help='debug mode if this flag is set (default: False)')
    args = parser.parse_args()
    app.run(host='127.0.0.1', port=5000, debug=args.debug)
