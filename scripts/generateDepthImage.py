
import re, json, argparse, os, math, itertools, time, math
from collections import deque
from PIL import Image

class DepthImageGenerator(object):

    # =========================================================================
    #
    # =========================================================================
    def __init__(self, infojson, composite):
        print 'Inside processSprite, info.json: ',infojson,', composite: ',composite

        json_data = None
        with open(infojson, 'r') as fd:
            json_data = json.load(fd)

        composite_data = None
        with open(composite, 'r') as fd:
            composite_data = json.load(fd)

        self.pixels = composite_data['pixel-order'].split('+')
        self.dimensions = json_data['metadata']['dimensions']
        self.fields = json_data['metadata']['fields']
        self.layer_fields = json_data['metadata']['layer_fields']
        self.layers = json_data['metadata']['layers']
        self.offset = json_data['metadata']['offset']
        self.base_path = os.path.dirname(composite)

        self.composite_array = []
        for pixel in self.pixels[:-1]:
            if len(pixel) > 0 and pixel[0] == '@':
                self.composite_array.append(pixel[1:])
            else:
                self.composite_array.append(pixel)

        self.depthMultiplier = int(math.floor(256.0 / (len(self.layers) + 1)))

        self.calculateCorrectOffsets()

    # =========================================================================
    #
    # =========================================================================
    def generateDepthImage(self):
        #rgb_img_path = os.path.join(self.base_path, "rgb.jpg")
        rgb_img_path = os.path.join(self.base_path, "rgb.png")
        self.spriteImg = Image.open(rgb_img_path)

        depth_img_path = os.path.join(self.base_path, "rgbd.png")

        img = Image.new("RGBA", (self.dimensions[0], self.dimensions[1] * self.spriteImageCount))

        pixelIdx = 0

        for pixelStack in self.composite_array:
            count = 1
            layers = '+'

            if pixelStack.isdigit():
                count = int(pixelStack)
            else:
                layers = pixelStack + '+'

            for i in xrange(count):
                x = (pixelIdx) % self.dimensions[0]
                y = (pixelIdx) / self.dimensions[0]

                depthValue = 0
                for layerCode in layers:
                    layerIndices = self.layerMap[layerCode]
                    for layerIdx in layerIndices:
                        yOffset = layerIdx * self.dimensions[1]
                        color = self.spriteImg.getpixel((x,y+yOffset))
                        #newColor = (color[0], color[1], color[2], depthValue)
                        newColor = (color[0], color[1], color[2], 255 - (depthValue * self.depthMultiplier))
                        img.putpixel((x,y+yOffset), newColor)
                        #print 'original color: ',color,', new color: ',newColor
                    depthValue += 1

                pixelIdx += 1


        totalPixels = self.dimensions[0] * self.dimensions[1]
        print 'Total pixels in image: ',totalPixels
        print 'Final pixel index: ',pixelIdx

        print 'Saving image to: ',depth_img_path
        img.save(depth_img_path, "PNG")


    # =========================================================================
    #
    # =========================================================================
    def generateDepthJpeg(self):
        rgb_img_path = os.path.join(self.base_path, "rgb.jpg")
        self.spriteImg = Image.open(rgb_img_path)

        depth_img_path = os.path.join(self.base_path, "depth.jpg")

        img = Image.new("RGB", (self.dimensions[0], self.dimensions[1] * self.spriteImageCount))

        pixelIdx = 0

        for pixelStack in self.composite_array:
            count = 1
            layers = '+'

            if pixelStack.isdigit():
                count = int(pixelStack)
            else:
                layers = pixelStack + '+'

            for i in xrange(count):
                x = (pixelIdx) % self.dimensions[0]
                y = (pixelIdx) / self.dimensions[0]

                depthValue = 0
                for layerCode in layers:
                    layerIndices = self.layerMap[layerCode]
                    for layerIdx in layerIndices:
                        yOffset = layerIdx * self.dimensions[1]
                        #color = self.spriteImg.getpixel((x,y+yOffset))
                        #newColor = (color[0], color[1], color[2], depthValue)
                        depthColor = ( 255 - (depthValue * self.depthMultiplier), 0, 0 )
                        img.putpixel((x,y+yOffset), depthColor)
                        #print 'original color: ',color,', new color: ',newColor
                    depthValue += 1

                pixelIdx += 1


        totalPixels = self.dimensions[0] * self.dimensions[1]
        print 'Total pixels in image: ',totalPixels
        print 'Final pixel index: ',pixelIdx

        print 'Saving image to: ',depth_img_path
        img.save(depth_img_path)


    # =========================================================================
    #
    # =========================================================================
    def calculateCorrectOffsets(self):
        self.maxOffset = 0
        self.spriteImageCount = 1               # always have one background
        self.layerMap = {}

        # First iterate over the offset map to find the number of layers and
        # keep track of the maximum offset
        for offtuple in self.offset:
            self.spriteImageCount += 1
            self.layerMap[offtuple[0]] = []
            if self.offset[offtuple] > self.maxOffset:
                self.maxOffset = self.offset[offtuple]

        # Now go through the offset map again, updating the offsets (they are
        # reversed in the info.json from their true position in the sprite).
        # We also want a quick way to know the sprite offsets for every layer.
        for offtuple in self.offset:
            newOffset = self.maxOffset - self.offset[offtuple]
            self.offset[offtuple] = newOffset
            self.layerMap[offtuple[0]].append(newOffset)

        self.layerMap['+'] = [self.maxOffset]

        print 'print max offset is: ',self.maxOffset
        print 'number of images in sprite is: ',self.spriteImageCount
        print 'new offset map: '
        print self.offset
        print 'generated layer index map: '
        print self.layerMap


# =========================================================================
#
# =========================================================================
def recurse(infoJsonPath, directory):
    # regular expression to allow removing base path for Girder storage
    rpRegex = re.compile('composite\.json')

    # Using a queue gives a depth-first search of the filesystem below the root path.
    dirQueue = deque([directory])

    while True :
        try :
            nextPath = dirQueue.popleft()
            try :
                nextList = [ os.path.join(nextPath, f) for f in os.listdir(nextPath) ]
            except OSError as osErr :
                # The current path was not a folder, but rather a file
                matcher = rpRegex.search(nextPath)
                if matcher:
                    print 'Going to process ',nextPath
                    imageGenerator = DepthImageGenerator(infoJsonPath, nextPath)
                    imageGenerator.generateDepthImage()
                    #imageGenerator.generateDepthJpeg()

                continue

            for f in nextList :
                dirQueue.append(f)
        except IndexError as indErr :
            print 'No more items in the queue, done.'
            break


###############################################################################
if __name__ == "__main__":
    description = "Python script to generate png images with depth encoded in alpha"

    parser = argparse.ArgumentParser(description=description)

    parser.add_argument("--rootdir", type=str, default="", help="Path to root of data set (where info.json lives)")

    args = parser.parse_args()

    infojson = os.path.join(args.rootdir, 'info.json')
    recurse(infojson, args.rootdir)

