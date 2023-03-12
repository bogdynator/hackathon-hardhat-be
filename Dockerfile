FROM node:14
# RUN apk add g++ make py3-pip

COPY . /usr/app

WORKDIR ./usr/app/slither



# RUN apk update
# RUN apk add python3
# RUN python3 setup.py install
# RUN pip3 install py-solc
RUN apt-get update
RUN apt-get install -y python3 python3-pip
RUN pip3 install install solc

RUN pip3 install slither-analyzer

RUN pip3 install solc-select
RUN solc-select install 0.8.0
RUN solc-select use 0.8.0


WORKDIR /usr/app

RUN npm install

EXPOSE 3000

CMD ["node", "index.js"]
