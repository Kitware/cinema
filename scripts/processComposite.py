#!/usr/bin/env python
import json, os, string, sys, time
from PIL import Image
#import Image

try:
    import argparse
except ImportError:
    import _argparse as argparse

class CompositeHandler(object):

    def __init__(self, info_json_file_path, composite_file_path):
        start_time = time.time()

        json_data = None
        with open(info_json_file_path, 'r') as fd:
            json_data = json.load(fd)

        composite_data = None
        with open(composite_file_path, 'r') as fd:
            composite_data = json.load(fd)

        pixels = composite_data['pixel-order'].split('+')
        self.order_map = { '' : False }
        self.composite_array = []
        self.dimensions = json_data['metadata']['dimensions']
        self.fields = json_data['metadata']['fields']
        self.layer_fields = json_data['metadata']['layer_fields']
        self.layers = json_data['metadata']['layers']
        self.offset = json_data['metadata']['offset']
        self.calculate_correct_offsets()
        self.base_path = os.path.dirname(composite_file_path)
        self.images = {}
        for pixel in pixels:
            if len(pixel) > 0:
                if pixel[0] == '@':
                    self.composite_array.append(int(pixel[1:]))
                else:
                    self.composite_array.append(pixel)
                    self.order_map[pixel] = ""

        print "Creation time", str(time.time() - start_time)

    def calculate_correct_offsets(self):
        self.maxOffset = 0
        for offtuple in self.offset:
            if self.offset[offtuple] > self.maxOffset:
                self.maxOffset = self.offset[offtuple]

        for offtuple in self.offset:
                self.offset[offtuple] = self.maxOffset - self.offset[offtuple]

        print 'print max offset is: ',self.maxOffset
        print 'new offset map: '
        print self.offset

    def compute_composite_order(self, query):
        """
        query = {layer}{field}+
        To disable layer use field = '_'
        """
        print 'inside compute_composite_order, query: ',query
        index = 0
        layer_toggle = {}
        for layer in self.layers:
            #layer_toggle[layer] = (query[index*2+1] != '_')
            layer_toggle[layer] = (query[index*2+1])
            index += 1

        for order in self.order_map:
            self.order_map[order] = self.maxOffset * self.dimensions[1]
            for layer in order:
                if layer_toggle[layer] != '_':
                    offset = self.offset[layer+layer_toggle[layer]]
                    self.order_map[order] = offset * self.dimensions[1]
                    #print order,layer_toggle[layer],layer,offset
                    break

        #print self.order_map

    def load_images(self, query):
        index = 0
        for layer in self.layers:
            field = query[index*2+1]
            index += 1

            if field != '_':
                filepath = os.path.join(self.base_path, self.fields[field], "%s.jpg" % layer)
                print "Load image: ", filepath
                self.images[layer] = Image.open(filepath)

    def process(self, query):
        start_time = time.time()

        self.compute_composite_order(query)
        #self.load_images(query)

        img_path = os.path.join(self.base_path, "rgb.jpg")
        new_file = os.path.join(self.base_path, "%s.jpg" % query)
        spriteImg = Image.open(img_path)
        box = (0,                                             # left
               self.maxOffset * self.dimensions[1],   # upper
               self.dimensions[0],                            # right
               (self.maxOffset + 1) * self.dimensions[1])           # lower
        region = spriteImg.crop(box)
        img = Image.new("RGB", (self.dimensions[0], self.dimensions[1]))
        img.paste(region, (0, 0, self.dimensions[0], self.dimensions[1]))

        pixelIdx = 0

        for order in self.composite_array:
            pixelInfo = 0
            try:
                pixelInfo = self.order_map[order]
                pixelIdx += 1
            except:
                pixelIdx += order

            x = (pixelIdx-1) % self.dimensions[0]
            y = (pixelIdx-1) / self.dimensions[0]
            img.putpixel((x,y), spriteImg.getpixel((x,y+pixelInfo)))

            # if isinstance(order, int):
            #     pixelIdx += order
            # elif self.order_map[order]:
            #     x = pixelIdx % self.dimensions[0]
            #     y = pixelIdx / self.dimensions[0]
            #     img.putpixel((x,y), self.images[self.order_map[order]].getpixel((x,y)))
            #     pixelIdx += 1
            # else:
            #     pixelIdx += 1

        print "Process time", str(time.time() - start_time)
        img.save(new_file)
        print "Wrote file: ",new_file


    def process_all(self):
        queries = []
        base_query = ""
        for layer in self.layers:
            base_query += str(layer)
            base_query += str('_')
        queries.append(base_query)

        index = 0
        for layer in self.layers:
            queries = self.compute_queries(queries, index, self.layer_fields[layer])
            index += 1

        for query in queries:
            print "Process: ", query
            self.process(query)
            print "done"


    def compute_queries(self, input_queries, field_idx, field_values):
        queries_to_add = []
        for field in field_values:
            for query in input_queries:
                new_query = list(query)
                new_query[field_idx*2+1] = str(field)
                queries_to_add.append("".join(new_query))
        return input_queries + queries_to_add


# =============================================================================
# Main
# =============================================================================

def main(argv=None,description="Image composite generator"):
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--infojson", type=str, default="", help="Path to the info.json file")
    parser.add_argument("--composite", type=str, default="", help="Path to the composite file")
    args = parser.parse_args()

    compositeHandler = CompositeHandler(args.infojson, args.composite)
    compositeHandler.process_all()
    #compositeHandler.process('AAB_C_D_E_F_G_H_I_J_K_L_')

if __name__ == "__main__":
    main()


